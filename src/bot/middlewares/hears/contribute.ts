import { Telegraf, Markup } from "telegraf";
import config from "~/config";
import ContributionModel from "~/database/models/CountributionModel";
import getArtworkInfoByUrl from "~/platforms";

export default Telegraf.hears(/#投稿/, async ctx => {

    if(ctx.chat.type == "private" && !config.ADMIN_LIST.includes(ctx.from?.id.toString()))
    {
        return await ctx.reply("不能在私聊中使用投稿，请在群里进行投稿")
    }

    try {
        let artworkInfo = await getArtworkInfoByUrl(ctx.message.text)
        let replyMessage = await ctx.reply(`感谢投稿 ! 正在召唤 @Revincx_Rua \n图片链接: ${artworkInfo.post_url}\n图片尺寸: ${artworkInfo.size.width}x${artworkInfo.size.height}`, {
            reply_to_message_id: ctx.message.message_id,
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('发到频道', `publish-${ctx.message.message_id}`),
                    Markup.button.callback('删除投稿', `delete-${ctx.message.message_id}`)],
                [
                    Markup.button.callback('发到频道并设为精选', `publish-${ctx.message.message_id}-q`)
                ]
            ])
        })
        
        let contribution = new ContributionModel({
            post_url: artworkInfo.post_url,
            chat_id: ctx.message.chat.id,
            user_id: ctx.message.from.id,
            user_name: ctx.message.from.username,
            message_id: ctx.message.message_id,
            reply_message_id: replyMessage.message_id
        })
    
        await contribution.save(err => { if (err) throw err })
    }
    catch (err) {
        if (err instanceof Error) {
            ctx.reply(err.message, {
                reply_to_message_id: ctx.message.message_id,
            })
            return
        }
    }

})