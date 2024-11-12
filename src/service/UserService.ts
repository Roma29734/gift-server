import {getDb} from '../mongo/driver';
import {getUserAvatarUrl} from "../tgWorks/tgWorks";

interface User {
    userId: number;
    userName: string;
    gifts: number;
    createAt?: string;
    dataUpdate?: string;
    imageAvatar?: string | null;
}

const usersCollection = getDb().collection<User>('users');

// Создание нового пользователя
export async function createUser(userId: number,
                                 userName: string,
                                 gifts: number,
                                 createAt?: string,
                                 dataUpdate?: string,
                                 imageAvatar?: string | null
) {

    const image = await getUserAvatarUrl(userId)

    const result = await usersCollection.insertOne({
        userId,
        userName,
        imageAvatar: image,
        createAt: createAt || new Date().toISOString(),
        dataUpdate: dataUpdate || new Date().toISOString(),
        gifts: gifts || 0,
    });
    return result.insertedId;
}

// Получение пользователя по ID
export async function getUserById(userId: number) {
    return await usersCollection.findOne({userId});
}

// Обновление данных пользователя
export async function updateUser(userId: number, updates: Partial<User>) {
    const result = await usersCollection.updateOne(
        {userId},
        {$set: {...updates, dataUpdate: new Date().toISOString()}}
    );
    return result.modifiedCount > 0;
}

// Увеличение количества подарков на 1 для пользователя
export async function incrementUserGifts(userId: number) {
    const result = await usersCollection.updateOne(
        { userId },
        { $inc: { gifts: 1 }, $set: { dataUpdate: new Date().toISOString() } }
    );
    return result.modifiedCount > 0;
}


// Получение топ-100 пользователей по количеству подарков
export async function getTop100UsersByGifts() {
    const topUsers = await usersCollection.find(
        {}, // Пустой фильтр для выбора всех пользователей
        {
            projection: {
                userId: 1,
                userName: 1,
                gifts: 1,
                imageAvatar: 1,
            },
        }
    )
        .sort({ gifts: -1 }) // Сортировка по убыванию по полю gifts
        .limit(100) // Ограничение до 100 результатов
        .toArray();

    return topUsers;
}

export async function deleteUser(userId: number): Promise<boolean> {
    try {
        console.log(`Поиск пользователя с userId: ${userId}`);

        // Проверка, существует ли пользователь с таким userId
        const user = await usersCollection.findOne({ userId });

        if (!user) {
            console.log(`Пользователь с userId ${userId} не найден`);
            return false; // Если пользователь не найден, возвращаем false
        }

        console.log(`Пользователь найден: `, user);

        // Попытка удаления пользователя
        const result = await usersCollection.deleteOne({ userId });
        console.log(`Удалено пользователей: ${result.deletedCount}`);

        // Если удаление прошло успешно, возвращаем true
        return result.deletedCount > 0;
    } catch (error) {
        console.error("Ошибка при удалении пользователя:", error);
        return false; // В случае ошибки возвращаем false
    }
}