import { eq } from 'drizzle-orm';
import { db } from './index';
import { categories, targets, workoutLogs, workouts } from './schema';

export async function seedDatabase(userId: number) {
    const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId));

    if (existing.length > 0) return;

    const newCats = await db
        .insert(categories)
        .values([
            { userId, name: 'Chest', colour: '#FF3B5C', icon: 'barbell-outline' },
            { userId, name: 'Back', colour: '#4F6EF7', icon: 'body-outline' },
            { userId, name: 'Legs', colour: '#FF9F0A', icon: 'walk-outline' },
            { userId, name: 'Shoulders', colour: '#30D158', icon: 'fitness-outline' },
            { userId, name: 'Arms', colour: '#BF5AF2', icon: 'flash-outline' },
            { userId, name: 'Cardio', colour: '#FF6B35', icon: 'heart-outline' },
        ])
        .returning();

    const c: Record<string, number> = {};
    newCats.forEach((cat) => (c[cat.name] = cat.id));

    await db.insert(targets).values([
        { userId, categoryId: null, period: 'weekly', targetValue: 4 },
        { userId, categoryId: c['Cardio'], period: 'weekly', targetValue: 2 },
        { userId, categoryId: null, period: 'monthly', targetValue: 16 },
    ]);

    const daysAgo = (n: number): string => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString().split('T')[0];
    };

    const newWorkouts = await db.insert(workouts).values([
        { userId, categoryId: c['Chest'], date: daysAgo(0), durationMins: 65, notes: 'Heavy bench day.' },
        { userId, categoryId: c['Back'], date: daysAgo(1), durationMins: 55, notes: 'Pull day.' },
        { userId, categoryId: c['Legs'], date: daysAgo(3), durationMins: 70, notes: 'Leg day.' },
        { userId, categoryId: c['Cardio'], date: daysAgo(4), durationMins: 30, notes: '5k run.' },
        { userId, categoryId: c['Shoulders'], date: daysAgo(5), durationMins: 50, notes: 'OHP day.' },
        { userId, categoryId: c['Arms'], date: daysAgo(7), durationMins: 45, notes: 'Arm day.' },
        { userId, categoryId: c['Chest'], date: daysAgo(8), durationMins: 60, notes: 'Volume chest.' },
        { userId, categoryId: c['Back'], date: daysAgo(9), durationMins: 55, notes: 'Row day.' },
        { userId, categoryId: c['Cardio'], date: daysAgo(10), durationMins: 25, notes: 'HIIT.' },
        { userId, categoryId: c['Legs'], date: daysAgo(11), durationMins: 75, notes: 'RDL day.' },
        { userId, categoryId: c['Chest'], date: daysAgo(14), durationMins: 60, notes: 'Bench day.' },
        { userId, categoryId: c['Back'], date: daysAgo(15), durationMins: 60, notes: 'Deadlift day.' },
        { userId, categoryId: c['Cardio'], date: daysAgo(17), durationMins: 40, notes: '8k jog.' },
        { userId, categoryId: c['Legs'], date: daysAgo(18), durationMins: 65, notes: 'Quad day.' },
        { userId, categoryId: c['Arms'], date: daysAgo(20), durationMins: 40, notes: 'Isolation.' },
    ]).returning();

    await db.insert(workoutLogs).values([
        { workoutId: newWorkouts[0].id, exerciseName: 'Flat Bench Press', sets: 4, reps: 8, weightKg: 90 },
        { workoutId: newWorkouts[0].id, exerciseName: 'Incline Bench Press', sets: 3, reps: 10, weightKg: 75 },
        { workoutId: newWorkouts[0].id, exerciseName: 'Cable Fly', sets: 3, reps: 12, weightKg: 20 },
        { workoutId: newWorkouts[1].id, exerciseName: 'Deadlift', sets: 4, reps: 5, weightKg: 140 },
        { workoutId: newWorkouts[1].id, exerciseName: 'Barbell Row', sets: 4, reps: 8, weightKg: 80 },
        { workoutId: newWorkouts[1].id, exerciseName: 'Lat Pulldown', sets: 3, reps: 12, weightKg: 65 },
        { workoutId: newWorkouts[2].id, exerciseName: 'Squat', sets: 5, reps: 5, weightKg: 120 },
        { workoutId: newWorkouts[2].id, exerciseName: 'Leg Press', sets: 4, reps: 10, weightKg: 180 },
        { workoutId: newWorkouts[3].id, exerciseName: 'Treadmill Run', sets: 1, reps: 1, weightKg: null },
        { workoutId: newWorkouts[4].id, exerciseName: 'Overhead Press', sets: 4, reps: 8, weightKg: 60 },
        { workoutId: newWorkouts[4].id, exerciseName: 'Lateral Raise', sets: 4, reps: 15, weightKg: 12 },
        { workoutId: newWorkouts[5].id, exerciseName: 'Barbell Curl', sets: 4, reps: 10, weightKg: 40 },
        { workoutId: newWorkouts[5].id, exerciseName: 'Tricep Pushdown', sets: 4, reps: 12, weightKg: 35 },
    ]);

    console.log('Seed complete');
}
