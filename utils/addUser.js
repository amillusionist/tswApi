import User from "../models/User";
import bcrypt from "bcrypt";
import connectDB from "../config/db";

const addUser = async (user) => {
    try {
        await connectDB();
        const user = await User.create(user);
        return user;
    }
    catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
}

export default addUser;