import dotenv from 'dotenv'
dotenv.config()

import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Post, User } from '../models'

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_MYSQL_HOST,
    port: 3306,
    username: process.env.DB_MYSQL_USERNAME,
    password: process.env.DB_MYSQL_PASSWORD,
    database: process.env.DB_MYSQL_DB_NAME,
    // synchronize: true,
    // logging: false,
    entities: [Post, User],
    migrations: [__dirname + '/migrations/*.{js,ts}'],
})

const userRepository = AppDataSource.getRepository(User)
const postRepository = AppDataSource.getRepository(Post)

export const repository = {
    user: userRepository,
    post: postRepository,
}
