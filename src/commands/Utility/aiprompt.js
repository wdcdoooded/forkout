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
        .setDescription('Test the modal flow and send data to a channel!'),
    
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

                // 9. SEND DATA TO A SPECIFIC CHANNEL
                // ⚠️ REPLACE THIS WITH YOUR ACTUAL CHANNEL ID ⚠️
                const targetChannelId = '1526107539303829524'; 
                const targetChannel = interaction.client.channels.cache.get(targetChannelId);

                if (targetChannel) {
                    // Create a log embed for the target channel
                    const logEmbed = createEmbed({
                        title: '📝 New AI Prompt Submission',
                        description: `A new prompt was submitted by <@${interaction.user.id}>.`,
                        color: 'info'
                    })
                    .addFields(
                        { name: 'Style', value: selectedStyle, inline: true },
                        { name: 'Palette', value: selectedColor, inline: true },
                        { name: 'Description', value: userDescription, inline: false }
                    )
                    .setFooter({ text: `User ID: ${interaction.user.id}` })
                    .setTimestamp();

                    // Send it to the channel
                    await targetChannel.send({ embeds: [logEmbed] });
                } else {
                    logger.warn(`Could not find target channel with ID: ${targetChannelId}`);
                }

                // 10. REPLY TO THE USER
                // Acknowledge the user's submission so the modal closes smoothly
                await submitted.reply({ 
                    content: '✅ Your prompt has been successfully saved and sent to the logging channel!', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        } catch (error) {
            logger.error('Test Modal Error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: `An error occurred: ${error.message}`, 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
    }
};
