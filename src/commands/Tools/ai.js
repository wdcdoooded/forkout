import { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    MessageFlags 
} from 'discord.js';
import { logger } from '../../utils/logger.js';
import { createEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Tell the AI what you need!'),
    
    category: 'Utility',

    async execute(interaction) {
        try {
            // 1. CREATE THE POP-UP FORM (MODAL)
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

            // 2. SHOW THE FORM TO THE USER
            await interaction.showModal(modal);

            // 3. WAIT FOR THEM TO HIT "SUBMIT"
            const submitted = await interaction.awaitModalSubmit({
                filter: i => i.customId === 'ai_request_modal' && i.user.id === interaction.user.id,
                time: 300_000 // 5 minutes before timeout
            }).catch(() => null);

            // 4. PROCESS THE SUBMISSION
            if (submitted) {
                const userPrompt = submitted.fields.getTextInputValue('user_requirement');

                // Acknowledge the submission immediately
                await submitted.reply({ 
                    content: '🧠 Sending your request to Gemini...', 
                    flags: MessageFlags.Ephemeral 
                });

                try {
                    // Use native fetch to hit the Gemini API directly
                    const apiKey = process.env.GEMINI_API_KEY;
                    if (!apiKey) {
                        throw new Error("GEMINI_API_KEY is missing from the .env file.");
                    }

                    // Direct HTTP POST to the Gemini endpoint
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: userPrompt }]
                            }]
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`API returned status: ${response.status}`);
                    }

                    const data = await response.json();
                    
                    // Extract the text from the API's JSON response
                    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

                    // Truncate to fit Discord's 4096 character limit for embeds
                    const safeResponse = responseText.length > 4096 
                        ? responseText.substring(0, 4093) + '...' 
                        : responseText;

                    // Build a native TitanBot embed
                    const responseEmbed = createEmbed({
                        title: '🧠 AI Response',
                        description: safeResponse,
                        color: 'primary'
                    }).setFooter({ text: 'Powered by Google Gemini' });

                    // Edit our loading message with the final AI output
                    await submitted.editReply({ 
                        content: `**Your Prompt:** ${userPrompt}`,
                        embeds: [responseEmbed] 
                    });

                } catch (apiError) {
                    logger.error('Gemini API Error:', apiError);
                    await submitted.editReply({
                        content: null,
                        embeds: [errorEmbed('API Error', 'Something went wrong while contacting the AI. Please try again later.')]
                    });
                }
            }
        } catch (error) {
            logger.error('AI Command Modal Error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'An error occurred while opening the AI prompt.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
    }
};
