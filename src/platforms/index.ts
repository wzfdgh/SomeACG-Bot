import { ArtworkInfo } from "~/types/Artwork";

export default async function getArtworkInfoByUrl(url: string): Promise<ArtworkInfo> {
    let matchPixiv = url.match(/https:\/\/www.pixiv.net(\/en)?\/artworks\/(\d{8})(\/)?/)
    let matchTwitter = url.match(/https:\/\/twitter.com\/(.+)\/status\/(\d+)/)
    let matchDanbooru = url.match(/https:\/\/danbooru.donmai.us\/posts\/(\d+)/)

    let module: any = {}

    if (matchPixiv) { 
        module = await import('~/platforms/pixiv');
        url = matchPixiv[0] 
    }
    if(matchTwitter)
    {
        module = await import('~/platforms/twitter');
        url = matchTwitter[0]
    }
    if(matchDanbooru)
    {
        module = await import('~/platforms/danbooru');
        url = matchDanbooru[0]
    }
    
    if (!module.default) throw new Error('不支持的链接类型, 目前仅仅支持 Pixiv,Twitter,Danbooru')

    return await module.default(url)
}