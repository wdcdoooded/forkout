import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default {
    // Adding slashOnly just in case TitanBot strictly requires it
    slashOnly: true,
    category: 'Tools',
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Tell the AI what you need!'),

    async execute(interaction) {
        // 1. SAFETY CHECK: Make sure the API key exists before trying to use it!
        if (!process.env.GEMINI_API_KEY) {
            return interaction.reply({ 
                content: '❌ Error: GEMINI_API_KEY is missing from the .env file.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Initialize Gemini HERE, safely inside the command
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // 2. CREATE THE POP-UP FORM
        const modal = new ModalBuilder()
            .setCustomId('ai_request_modal')
            .setTitle('AI Generation Request');

        const requirementInput = new TextInputBuilder()
            .setCustomId('user_requirement')
            .setLabel('What output do you need?')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('e.g., Write me a short story about a cybernetic cat...')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(requirementInput);
        modal.addComponents(row);

        // 3. SHOW THE FORM
        await interaction.showModal(modal);

        // 4. WAIT FOR SUBMISSION
        const submitted = await interaction.awaitModalSubmit({
            filter: i => i.customId === 'ai_request_modal' && i.user.id === interaction.user.id,
            time: 300_000 
        }).catch(() => null);

        // 5. PROCESS WITH REAL AI
        if (submitted) {
            const userPrompt = submitted.fields.getTextInputValue('user_requirement');

            await submitted.reply({ 
                content: '🧠 Sending your request to Gemini...', 
                flags: MessageFlags.Ephemeral 
            });

            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(userPrompt);
                const aiResponse = result.response.text();

                // Keep it under Discord's 2000 character limit
                const finalMessage = `**You asked:** ${userPrompt}\n\n**Gemini:**\n${aiResponse}`;
                const safeMessage = finalMessage.substring(0, 2000);

                await submitted.editReply({ content: safeMessage });

            } catch (error) {
                console.error("AI Generation Error:", error);
                await submitted.editReply({ content: '❌ An error occurred while contacting the AI.' });
            }
        }
    }
};
