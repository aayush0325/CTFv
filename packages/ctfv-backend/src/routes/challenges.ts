import { eq } from "drizzle-orm";
import {  Hono } from "hono";
import { JwtVariables, sign } from "hono/jwt";

type Variables = JwtVariables;
import { Bindings } from "../../env";
import * as schema from "../db/schema";

import { authMiddleware } from "../middlewares/auth";
import { adminMiddleware } from "../middlewares/admin";

import { getDB } from "..";

const challengesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

challengesRouter.post('/create', adminMiddleware, async (c) => {
    
    try{
        const db = getDB(c);
        const { name, description, url, points, author, category } = await c.req.json();
        const newChallenge = await db.insert(schema.challenges).values({
            name,
            url,
            points,
            author,
            category,
            description
        }).returning().get();

        return c.json(newChallenge)
    }catch(e){
        return c.json({
            error: (e as Error).message
        })
    }
})

challengesRouter.post('/read',authMiddleware, async (c) => {
    try{
        const db = getDB(c);
        const allChallenges = await db.select().from(schema.challenges);
    
        const groupedChallenges = allChallenges.reduce((acc, challenge) => {
            if (!acc[challenge.category]) {
                acc[challenge.category] = [];
            }
            acc[challenge.category].push({
                id: challenge.id,
                name: challenge.name,
                description: challenge.description,
                url: challenge.url,
                points: challenge.points,
                author: challenge.author
            });
            return acc;
        }, {} as Record<string, any>);

        const response = {
            challenges: Object.entries(groupedChallenges).map(([category, challenges]) => ({
                category,
                challenges
            }))
        };

        return c.json(response)
    }catch(e){
        return c.json({
            error:(e as Error).message
        })
    }
})

challengesRouter.put('/update/:id', adminMiddleware, async (c) => {
    try{
        const db = getDB(c)
        const { name, description, url, points, author, category } = await c.req.json();
        const challengeId = c.req.param("id");
        const updatedChallenge = await db
        .update(schema.challenges)
        .set({ name, description, url, points, author, category })
        .where(eq(schema.challenges.id, challengeId))
        .returning({
            id: schema.challenges.id,
            name: schema.challenges.name,
            description: schema.challenges.description,
            url: schema.challenges.url,
            points: schema.challenges.points,
            author: schema.challenges.author,
            category: schema.challenges.category
        });

        if(!updatedChallenge){
            return c.json({
                error: "challenge not found"
            })
        }

        return c.json(updatedChallenge[0]);
    }catch(e){
        return c.json({
            error: (e as Error).message
        })
    }
})

challengesRouter.delete('/delete/:id',adminMiddleware, async (c) => {
    try{
        const db = getDB(c)
        const challengeId = c.req.param("id");
        const deletedChallenge = await db.delete(schema.challenges).
        where(eq(schema.challenges.id, challengeId)).
        returning().get()

        if (!deletedChallenge) {
            return c.json({ error: "Challenge not found" });
        }

        return c.json(deletedChallenge)
    }catch(e){
        return c.json({
            error: (e as Error).message
        })
    }
})

export default challengesRouter;
