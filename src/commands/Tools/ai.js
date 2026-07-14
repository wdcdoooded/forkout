import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';

export default {
    // This defines what shows up when a user types /ai in Discord
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Tell the AI what you need!'),

    async execute(interaction) {
        // 1. CREATE THE POP-UP FORM (MODAL)
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

        // 2. SHOW THE FORM TO THE USER
        await interaction.showModal(modal);

        // 3. WAIT FOR THEM TO HIT "SUBMIT"
        const submitted = await interaction.awaitModalSubmit({
            // Ensure we only catch the modal submitted by THIS user
            filter: i => i.customId === 'ai_request_modal' && i.user.id === interaction.user.id,
            time: 300_000 // Give them 5 minutes to type before it times out
        }).catch(() => null);

        // 4. PROCESS THE SUBMISSION
        if (submitted) {
            // Grab the text they typed
            const userPrompt = submitted.fields.getTextInputValue('user_requirement');

            // Send a quick loading message so Discord doesn't give a "failed" error
            await submitted.reply({ 
                content: '🧠 Processing your request...', 
                flags: MessageFlags.Ephemeral 
            });

            // --- THIS IS WHERE YOU WILL CALL YOUR AI API ---
            // For now, we will just simulate a fake 2-second AI response
            
            setTimeout(async () => {
                const fakeAiResponse = "This is where the magic AI text will eventually go!";
                
                // Edit the loading message with the final result
                await submitted.editReply({ 
                    content: `**You asked:** ${userPrompt}\n\n**AI Response:**\n${fakeAiResponse}` 
                });
            }, 2000);
        }
    }
};
