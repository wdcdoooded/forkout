import { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    MessageFlags 
} from 'discord.js';
import { logger } from '../../utils/logger.js';
import { createEmbed } from '../../utils/embeds.js';

export default {
    data: new SlashCommandBuilder()
        .setName('aiprompt')
        .setDescription('Test the modal flow without AI!'),
    
    category: 'Utility',

    async execute(interaction) {
        try {
            // 1. CREATE THE MODAL
            const modal = new ModalBuilder()
                .setCustomId('avatar_prompt_modal')
                .setTitle('Avatar Prompt Generator (TEST)');

            // 2. TEXT INPUT FOR COLOR PALETTE
            const colorInput = new TextInputBuilder()
                .setCustomId('palette_color')
                .setLabel('Color Palette')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., Cyberpunk, Pastel, Monochromatic')
                .setRequired(true);

            // 3. TEXT INPUT FOR ART STYLE
            const styleInput = new TextInputBuilder()
                .setCustomId('art_style')
                .setLabel('Art Style')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., Anime, Realistic, 3D Render')
                .setRequired(true);

            // 4. TEXT INPUT FOR DESCRIPTION
            const descriptionInput = new TextInputBuilder()
                .setCustomId('avatar_description')
                .setLabel('Describe your character')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('e.g., A cybernetic cat with glowing eyes...')
                .setRequired(true);

            // 5. WRAP ALL COMPONENTS IN ACTION ROWS
            const row1 = new ActionRowBuilder().addComponents(colorInput);
            const row2 = new ActionRowBuilder().addComponents(styleInput);
            const row3 = new ActionRowBuilder().addComponents(descriptionInput);
            
            modal.addComponents(row1, row2, row3);

            // 6. SHOW THE MODAL TO THE USER
            await interaction.showModal(modal);

            // 7. WAIT FOR SUBMISSION
            const submitted = await interaction.awaitModalSubmit({
                filter: i => i.customId === 'avatar_prompt_modal' && i.user.id === interaction.user.id,
                time: 300_000 // 5 minutes before timeout
            }).catch(() => null);

            // 8. PROCESS THE SUBMISSION
            if (submitted) {
                // Safely extract the text values
                const selectedColor = submitted.fields.getTextInputValue('palette_color');
                const selectedStyle = submitted.fields.getTextInputValue('art_style');
                const userDescription = submitted.fields.getTextInputValue('avatar_description');

                // Acknowledge quickly to prevent timeouts
                await submitted.reply({ 
                    content: '⚙️ Processing mock data...', 
                    flags: MessageFlags.Ephemeral 
                });

                // 9. SIMULATE AI DELAY AND RESPOND
                setTimeout(async () => {
                    // Format into a clean Discord embed
                    const responseEmbed = createEmbed({
                        title: '🧪 Mock AI Response',
                        description: `**Your inputs were successfully captured!**\n\nIf the AI was connected, it would generate a prompt based on:\n\n**Description:** ${userDescription}`,
                        color: 'success'
                    })
                    .addFields(
                        { name: 'Style', value: selectedStyle, inline: true },
                        { name: 'Palette', value: selectedColor, inline: true }
                    )
                    .setFooter({ text: 'Test Flow Complete' });

                    // Send the final result
                    await submitted.editReply({ 
                        content: null,
                        embeds: [responseEmbed] 
                    });
                }, 2000); // 2-second fake loading delay
            }
        } catch (error) {
            logger.error('Test Modal Error:', error);
            if (!interaction.replied && !interaction.deferred) {
                // If it crashes, this will tell us exactly why in Discord
                await interaction.reply({ 
                    content: `An error occurred: ${error.message}`, 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
    }
};
