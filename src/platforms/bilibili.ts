import { ArtworkInfo } from '~/types/Artwork';
import { getDynamicInfo } from './bilibili-api/dynamic';

export default async function getArtworkInfo(
    post_url: string,
    indexes = [0]
): Promise<ArtworkInfo> {
    const url = new URL(post_url);

    const dynamic_id =
        url.pathname.indexOf('/') == -1
            ? url.pathname
            : url.pathname.split('/').pop();

    if (!dynamic_id) {
        throw new Error('Bilibili URL is invalid');
    }

    const dynamic = await getDynamicInfo(dynamic_id);

    if (dynamic.module_dynamic.major.type !== 'MAJOR_TYPE_OPUS') {
        throw new Error('Dynamic is not a bilibili opus post');
    }

    if (dynamic.module_dynamic.major.opus.pics.length === 0) {
        throw new Error('Dynamic does not contain any images');
    }

    if (indexes.length === 1 && indexes[0] === -1)
        indexes = Array.from(
            {
                length: dynamic.module_dynamic.major.opus.pics.length
            },
            (_, i) => i
        );

    const photos = dynamic.module_dynamic.major.opus.pics
        .filter((_, index) => indexes.includes(index))
        .map(item => ({
            url_thumb: item.url + '@1024w_1024h.jpg',
            url_origin: item.url,
            size: {
                width: item.width,
                height: item.height
            }
        }));

    return {
        source_type: 'bilibili',
        post_url: post_url,
        title: dynamic.module_dynamic.major.opus.title || undefined,
        desc: dynamic.module_dynamic.major.opus.summary?.text || undefined,
        artist: {
            type: 'bilibili',
            uid: dynamic.module_author.mid,
            name: dynamic.module_author.name
        },
        photos
    };
}
