import { EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';

export const sendDailySearch = async (client) => {
    const targetChannelId = '1525042114587525201'; // Replace with your channel ID
    
    try {
        const channel = await client.channels.fetch(targetChannelId);
        if (!channel) return;

        // Picsum automatically returns a random 800x600 image every time this URL is called!
        const randomImageUrl = 'https://picsum.photos/800/600?random=' + Date.now();

        const embed = new EmbedBuilder()
            .setTitle('💡 Your Daily Design Inspiration')
            .setDescription('Here is a random high-quality image to spark your creativity today.')
            .setImage(randomImageUrl)
            .setColor('#3498DB')
            .setFooter({ text: 'Powered by Lorem Picsum (No Auth PoC)' });

        await channel.send({ embeds: [embed] });
        logger.info('✅ Successfully sent Daily Inspiration PoC!');
        
    } catch (error) {
        logger.error('❌ Failed to send inspiration:', error);
    }
};
