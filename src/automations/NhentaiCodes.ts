import { Client, } from 'discord.js';
import fetch from "node-fetch";

export class NhentaiCodes {



public static setup(client: Client): void {

  client.on('messageCreate', (check) => {
    const text = check.content;
    const hentai = text.match(/\b\d{6}\b/);
    if (check.author.bot) return
      if (hentai !== null && text.match(/(^| )\d{6}($| )/)){
        fetch('https://nhentai.net/g/'+hentai[0]+'/')
          .then(res => {
            if(res.ok) {
              check.channel.send('https://nhentai.net/g/'+hentai[0]+'/')
            } else {
              check.react('840176060364226590')
            }
          });
      }
  });
 }
}
