import axios from "axios";
import {botToken} from "../../config";

interface TelegramFileResponse {
    ok: boolean;
    result: {
        file_id: string;
        file_unique_id: string;
        file_size: number;
        file_path: string;
    };
}

interface TelegramUserProfilePhotosResponse {
    ok: boolean;
    result: {
        total_count: number;
        photos: { file_id: string }[][];
    };
}


export async function getUserAvatarUrl(userId: number): Promise<string | null> {
    try {

        const profilePhotosResponse = await axios.get<TelegramUserProfilePhotosResponse>(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos`, {
            params: { user_id: userId, limit: 1 }
        });

        if (!profilePhotosResponse.data.result || !profilePhotosResponse.data.result.photos.length) {
            console.log("Нет доступных фотографий для пользователя");
            return null;
        }


        const fileId = profilePhotosResponse.data.result.photos[0][0].file_id;


        const fileResponse = await axios.get<TelegramFileResponse>(`https://api.telegram.org/bot${botToken}/getFile`, {
            params: { file_id: fileId }
        });

        const filePath = fileResponse.data.result.file_path;
        const avatarUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        return avatarUrl;
    } catch (error) {
        console.error("Ошибка при получении аватара:", error);
        return null;
    }
}