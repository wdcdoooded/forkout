import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ai-generate')
        .setDescription('Tell the AI what you need!'),

    async execute(interaction) {
        // Create the pop-up form
        const modal = new ModalBuilder()
            .setCustomId('ai_request_modal')
            .setTitle('AI Generation Request');

        // Create the free-text input space
        const requirementInput = new TextInputBuilder()
            .setCustomId('user_requirement')
            .setLabel('What output do you need?')
            .setStyle(TextInputStyle.Paragraph) // Paragraph makes it a large text box
            .setPlaceholder('e.g., Write me a short story about a cybernetic cat...')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(requirementInput);
        modal.addComponents(row);

        // Show the form to the user
        await interaction.showModal(modal);
    }
};
