import { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder, 
    MessageFlags 
} from 'discord.js';
import { logger } from '../../utils/logger.js';
import { createEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
    data: new SlashCommandBuilder()
        .setName('aiprompt')
        .setDescription('Design your dream avatar and let AI engineer the perfect prompt!'),
    
    category: 'Utility',

    async execute(interaction) {
        try {
            // 1. CREATE THE MODAL
            const modal = new ModalBuilder()
                .setCustomId('avatar_prompt_modal')
                .setTitle('Avatar Prompt Generator');

            // 2. CREATE DROPDOWN FOR COLOR PALETTE
            const colorSelect = new StringSelectMenuBuilder()
                .setCustomId('palette_color')
                .setPlaceholder('Choose a main color palette...')
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Cyberpunk / Neon').setValue('Cyberpunk/Neon'),
                    new StringSelectMenuOptionBuilder().setLabel('Soft Pastel').setValue('Soft Pastel'),
                    new StringSelectMenuOptionBuilder().setLabel('Dark / Gothic').setValue('Dark/Gothic'),
                    new StringSelectMenuOptionBuilder().setLabel('Vibrant & Colorful').setValue('Vibrant'),
                    new StringSelectMenuOptionBuilder().setLabel('Monochromatic').setValue('Monochromatic')
                );

            // 3. CREATE DROPDOWN FOR ART STYLE
            const styleSelect = new StringSelectMenuBuilder()
                .setCustomId('art_style')
                .setPlaceholder('Choose an art style...')
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Anime / Manga').setValue('Anime'),
                    new StringSelectMenuOptionBuilder().setLabel('Hyper-Realistic').setValue('Hyper-Realistic'),
                    new StringSelectMenuOptionBuilder().setLabel('Oil Painting').setValue('Oil Painting'),
                    new StringSelectMenuOptionBuilder().setLabel('Pixel Art').setValue('Pixel Art'),
                    new StringSelectMenuOptionBuilder().setLabel('3D Render (Unreal Engine)').setValue('3D Render')
                );

            // 4. CREATE TEXT INPUT FOR DESCRIPTION
            const descriptionInput = new TextInputBuilder()
                .setCustomId('avatar_description')
                .setLabel('Describe your character')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('e.g., A cybernetic cat with glowing eyes wearing a leather jacket...')
                .setRequired(true);

            // 5. WRAP ALL COMPONENTS IN ACTION ROWS
            const row1 = new ActionRowBuilder().addComponents(colorSelect);
            const row2 = new ActionRowBuilder().addComponents(styleSelect);
            const row3 = new ActionRowBuilder().addComponents(descriptionInput);
            
            modal.addComponents(row1, row2, row3);

            // 6. SHOW THE MODAL TO THE USER
            await interaction.showModal(modal);

            // 7. WAIT FOR SUBMISSION
            const submitted = await interaction.awaitModalSubmit({
                filter: i => i.customId === 'avatar_prompt_modal' && i.user.id === interaction.user.id,
                time: 300_000 
            }).catch(() => null);

            // 8. PROCESS THE SUBMISSION
            if (submitted) {
                const colorRow = submitted.components.find(r => r.components[0].customId === 'palette_color');
                const selectedColor = colorRow?.components[0]?.values[0] || 'No specific palette';

                const styleRow = submitted.components.find(r => r.components[0].customId === 'art_style');
                const selectedStyle = styleRow?.components[0]?.values[0] || 'No specific style';

                const userDescription = submitted.fields.getTextInputValue('avatar_description');

                await submitted.reply({ 
                    content: '🎨 Engineering the perfect prompt with Gemini...', 
                    flags: MessageFlags.Ephemeral 
                });

                try {
                    const aiInstructions = `You are an expert AI image generation prompt engineer. 
I will give you a character description, an art style, and a color palette. 
Your job is to generate a highly detailed, comma-separated prompt that I can copy and paste into an AI image generator to get the best possible result. Keep it under 100 words.

Character Description: ${userDescription}
Art Style: ${selectedStyle}
Color Palette: ${selectedColor}`;

                    const apiKey = process.env.GEMINI_API_KEY;
                    if (!apiKey) throw new Error("GEMINI_API_KEY is missing from the .env file.");

                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: aiInstructions }] }]
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`API returned status: ${response.status}`);
                    }

                    const data = await response.json();
                    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No prompt generated.";

                    const responseEmbed = createEmbed({
                        title: '✨ Your AI Avatar Prompt',
                        description: `**Copy and paste this into an image generator:**\n\n\`\`\`\n${responseText}\n\`\`\``,
                        color: 'primary'
                    })
                    .addFields(
                        { name: 'Style', value: selectedStyle, inline: true },
                        { name: 'Palette', value: selectedColor, inline: true }
                    )
                    .setFooter({ text: 'Engineered by Google Gemini' });

                    await submitted.editReply({ 
                        content: null,
                        embeds: [responseEmbed] 
                    });

                } catch (apiError) {
                    logger.error('Gemini API Error:', apiError);
                    await submitted.editReply({
                        content: null,
                        embeds: [errorEmbed('API Error', 'Failed to generate prompt. Please try again.')]
                    });
                }
            }
        } catch (error) {
            logger.error('Avatar Prompt Modal Error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'An error occurred while opening the generator.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
    }
};
