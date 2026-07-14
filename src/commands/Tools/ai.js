import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API using the key you put in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Tell the AI what you need!'),
    
    category: 'Tools', // <--- ADD THIS EXACT LINE!

    async execute(interaction) {
       // ... the rest of the code ...
        // 1. CREATE THE POP-UP FORM
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

        // 2. SHOW THE FORM
        await interaction.showModal(modal);

        // 3. WAIT FOR SUBMISSION
        const submitted = await interaction.awaitModalSubmit({
            filter: i => i.customId === 'ai_request_modal' && i.user.id === interaction.user.id,
            time: 300_000 
        }).catch(() => null);

        // 4. PROCESS WITH REAL AI
        if (submitted) {
            const userPrompt = submitted.fields.getTextInputValue('user_requirement');

            // Discord needs an immediate response, so we tell the user we are thinking
            await submitted.reply({ 
                content: '🧠 Sending your request to Gemini...', 
                flags: MessageFlags.Ephemeral 
            });

            try {
                // Call the Gemini 1.5 Flash model (very fast and free)
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                
                // Wait for the AI to generate the text
                const result = await model.generateContent(userPrompt);
                const aiResponse = result.response.text();

                // Discord has a strict 2000-character limit per message!
                // If the AI writes a massive essay, we have to cut it off so the bot doesn't crash.
                const finalMessage = `**You asked:** ${userPrompt}\n\n**Gemini says:**\n${aiResponse}`;
                const safeMessage = finalMessage.substring(0, 2000);

                // Send the final result back to the user
                await submitted.editReply({ content: safeMessage });

            } catch (error) {
                console.error("AI Generation Error:", error);
                await submitted.editReply({ content: '❌ An error occurred while contacting the AI.' });
            }
        }
    }
};
