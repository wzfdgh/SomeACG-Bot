// import { adminPredicate, NonAdminHandler } from "~/bot/middlewares/guard"
import { parseParams } from "~/utils/param-parser"
import { Context, Telegraf } from "telegraf"
import { Message } from 'telegraf/typings/core/types/typegram'
import getArtworkInfoByUrl from "~/platforms"
import { publishArtwork } from "~/services/artwork-service"
import { Contribution } from "~/types/Contribution"
import { getContributionById } from "~/database/operations/contribution"

async function showHelp(ctx: Context) {
    await ctx.reply("命令语法不正确\n命令语法: /push [args(key=value)] <target>", {
        reply_to_message_id: ctx.message?.message_id
    })
}

export default Telegraf.command('push', async ctx => {
    let command = parseParams(ctx.message.text)
    if (!command.target || !command.params) return await showHelp(ctx)
    if (!command.params['tags']) return await ctx.reply("请至少设置一个标签", {
        reply_to_message_id: ctx.message.message_id
    })
    let reply_to_message = ctx.message.reply_to_message
    if (reply_to_message && (reply_to_message as Message.DocumentMessage).document == undefined) {
        return await ctx.reply("回复的消息必须是一个文件!", {
            reply_to_message_id: ctx.message.message_id
        })
    }
    let tags_string = command.params['tags'] as string
    let waiting_message = await ctx.reply('正在发布作品...', {
        reply_to_message_id: ctx.message.message_id
    })
    try {
        let artwork_info = await getArtworkInfoByUrl(command.target)
        let contribution: Contribution | undefined
        let result = await publishArtwork(artwork_info, {
            is_quality: command.params['quality'] ? true : false,
            picture_index: command.params['picture_index'] ? parseInt(command.params['picture_index']) : 0,
            artwork_tags: tags_string.search(',') == -1 ? [ tags_string ] : tags_string.split(/,|，/),
            origin_file_id: reply_to_message ? (reply_to_message as Message.DocumentMessage).document.file_id : undefined,
            contribution: contribution
        })
        if (result.succeed) {
            await ctx.telegram.editMessageText(waiting_message.chat.id, waiting_message.message_id, undefined, '作品发布成功~')
            if (command.params['contribute_from']) {
                let contribution = await getContributionById(command.params['contribute_from'])
                ctx.telegram.editMessageText(contribution.chat_id, contribution.reply_message_id, undefined, "您的投稿已经审核通过并发布到频道~")
            }
            return
        }
        return await ctx.telegram.editMessageText(waiting_message.chat.id, waiting_message.message_id, undefined, '作品发布失败: ' + result.message)

    }
    catch (err) {
        console.log(err)
        if (err instanceof Error) {
            return await ctx.telegram.editMessageText(waiting_message.chat.id, waiting_message.message_id, undefined, '操作失败: ' + err.message)
        }
        return await ctx.telegram.editMessageText(waiting_message.chat.id, waiting_message.message_id, undefined, '操作失败: 未知错误')
    }

})