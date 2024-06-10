import { db } from "../../../lib/db";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import * as z from 'zod';

// define a schema for input validation
const userSchema = z
  .object({
    username: z.string().min(1, 'Username is required').max(100),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must have than 8 characters'),
  })

export async function POST(req: Request){
    try {
        const body = await req.json();
        const { email, username, password } = userSchema.parse(body);

        // Check if the user already exists
        const existingUserByEmail = await db.user.findUnique({
            where: { email }
        });
        if (existingUserByEmail) {
            return NextResponse.json({ user: null, message : "User with this email already exists"},{status: 409});
        }

        // Check if the username already exists
        const existingUserByUsername = await db.user.findUnique({
            where: { username }
        });
        if (existingUserByUsername) {
            return NextResponse.json({ user: null, message : "User with this username already exists"},{status: 409});
        }

        const hashedPassword = await hash(password, 10);

        const newUser = await db.user.create({
            data: {
                email,
                username,
                password: hashedPassword
            }
        });
        const { password: newUserPassword, ...rest } = newUser;

        return NextResponse.json({user: rest, message: "User created successfully"},{status: 201});
    } catch (error) {
        console.error(error);
        return NextResponse.json({message: "Something went wrong"}, {status: 500});
    }
}