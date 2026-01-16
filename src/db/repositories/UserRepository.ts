import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { users } from "../schema";
import type { NewUser, User } from "../types";

export const UserRepository = {
	async findAll(db: Database): Promise<User[]> {
		return db.select().from(users);
	},

	async findById(db: Database, userId: string): Promise<User | undefined> {
		const results = await db
			.select()
			.from(users)
			.where(eq(users.userId, userId));
		return results[0];
	},

	async findByEmail(db: Database, email: string): Promise<User | undefined> {
		const results = await db.select().from(users).where(eq(users.email, email));
		return results[0];
	},

	async create(db: Database, data: NewUser): Promise<User> {
		const results = await db.insert(users).values(data).returning();
		return results[0];
	},

	async update(
		db: Database,
		userId: string,
		data: Partial<Omit<NewUser, "userId">>,
	): Promise<User | undefined> {
		const results = await db
			.update(users)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(users.userId, userId))
			.returning();
		return results[0];
	},

	async delete(db: Database, userId: string): Promise<boolean> {
		const results = await db
			.delete(users)
			.where(eq(users.userId, userId))
			.returning();
		return results.length > 0;
	},
};
