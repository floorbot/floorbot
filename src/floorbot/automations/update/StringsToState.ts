




        // const stringTable = new MarkovStringTable(pool);
        // stringTable.selectAll({ limit: 1 }).then(async rows => {
        //     for (const row of rows) {
        //         const split = row.content.split(' ').filter(part => part);

        //         for (const [i, part] of split.entries()) {
        //             const state = [split[i - 2], split[i - 1]].filter(part => part).join(' ') || null;
        //             await this.stateTable.insert({
        //                 epoch: row.epoch,
        //                 bot: row.bot,
        //                 user_id: row.user_id,
        //                 guild_id: row.guild_id,
        //                 channel_id: row.channel_id,
        //                 message_id: row.message_id,
        //                 message_part: i,
        //                 current_state: state,
        //                 next_value: part
        //             });
        //         }

        //         await this.stateTable.insert({
        //             epoch: row.epoch,
        //             bot: row.bot,
        //             user_id: row.user_id,
        //             guild_id: row.guild_id,
        //             channel_id: row.channel_id,
        //             message_id: row.message_id,
        //             message_part: split.length,
        //             current_state: [split[split.length - 2], split[split.length - 1]].filter(part => part).join(' ') || null,
        //             next_value: null
        //         });
        //     }
        // });

        // for (let i = 0; i < 200; i++) {
        //     this.stateTable.selectRandomState({ currentState: null, channelId: '180194035976241152' }).then(async state => {
        //         let states = [state];
        //         let words = [];
        //         if (state) words.push(state.next_value);
        //         // console.log(state?.message_id, words);
        //         while (state && state.next_value) {
        //             state = await this.stateTable.selectRandomState({ currentState: [words[words.length - 2], words[words.length - 1]].filter(part => part).join(' '), channelId: '180194035976241152' });
        //             if (state) words.push(state.next_value);
        //             states.push(state);
        //             // console.log(state?.message_id, words);
        //         }
        //         const stats = states.reduce((obj: any, state) => {
        //             if (state) {
        //                 if (!obj[state.message_id]) obj[state.message_id] = 0;
        //                 obj[state.message_id]++;
        //             }
        //             return obj;
        //         }, {});
        //         const refs = Object.keys(stats).length;
        //         if (words.length === 1 || refs >= 2) console.log(`[Markov]<${refs}> ${words.join(' ')}`);
        //     });
        // }
