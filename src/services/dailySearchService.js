import { EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { logger } from '../utils/logger.js';

export const sendDailySearch = async (client) => {
    // Replace with the ID of the channel where you want the daily Digimon to post
    const targetChannelId = '1525042114587525201'; 

    try {
        // 1. Fetch the full list of Digimon from the free public API
        const response = await axios.get('https://digimon-api.vercel.app/api/digimon');
        const digimonList = response.data;

        // 2. Pick a random Digimon from the list
        const randomDigimon = digimonList[Math.floor(Math.random() * digimonList.length)];

        // 3. Find the channel in your Discord server
        const channel = await client.channels.fetch(targetChannelId);
        if (!channel) {
            logger.warn(`Daily Digimon Task: Could not find channel ${targetChannelId}`);
            return;
        }

        // 4. Build a beautiful embed using the random Digimon's data
        const embed = new EmbedBuilder()
            .setTitle(`👾 Daily Digimon: ${randomDigimon.name}!`)
            .setDescription(`**Level:** ${randomDigimon.level}`)
            .setImage(randomDigimon.img)
            .setColor('#FF9900')
            .setFooter({ text: 'Powered by the free Digimon API' });

        // 5. Send it to the channel!
        await channel.send({ embeds: [embed] });
        logger.info(`✅ Successfully sent Daily Digimon: ${randomDigimon.name}`);
        
    } catch (error) {
        logger.error('❌ Failed to fetch or send the Daily Digimon:', error);
    }
};
