import { Sequelize, DataTypes, Model } from 'sequelize';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

export class User extends Model {
  declare id: string;
  declare email: string;
  declare name: string;
  declare picture: string;
  declare role: string;
  declare level: number;
  declare xp: number;
  declare voucherXp: number;
  declare rank: string;
  declare joinDate: string;
}

User.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING },
  picture: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'student' },
  level: { type: DataTypes.INTEGER, defaultValue: 1 },
  xp: { type: DataTypes.INTEGER, defaultValue: 0 },
  voucherXp: { type: DataTypes.INTEGER, defaultValue: 0 },
  rank: { type: DataTypes.STRING, defaultValue: 'Novice' },
  joinDate: { type: DataTypes.STRING },
}, { sequelize, modelName: 'user' });

export class Lab extends Model {
  declare id: string;
  declare title: string;
  declare title_en: string;
  declare description: string;
  declare description_en: string;
  declare difficulty: string;
  declare category: string;
  declare points: number;
  declare solves: number;
  declare flag: string;
  declare contentUrl: string;
  declare isExam: boolean;
  declare downloadUrl: string;
  declare price: number;
  declare duration: number;
}

Lab.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  title_en: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT },
  description_en: { type: DataTypes.TEXT, allowNull: true },
  difficulty: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING },
  points: { type: DataTypes.INTEGER, defaultValue: 0 },
  solves: { type: DataTypes.INTEGER, defaultValue: 0 },
  flag: { type: DataTypes.STRING, allowNull: false },
  contentUrl: { type: DataTypes.STRING },
  isExam: { type: DataTypes.BOOLEAN, defaultValue: false },
  downloadUrl: { type: DataTypes.STRING, allowNull: true },
  price: { type: DataTypes.INTEGER, defaultValue: 0 },
  duration: { type: DataTypes.INTEGER, defaultValue: 60 },
}, { sequelize, modelName: 'lab' });

export class Submission extends Model {
  declare id: number;
  declare userId: string;
  declare labId: string;
  declare status: string;
  declare flags: string;
  declare fileUrl: string;
  declare adminComment: string;
  declare startTime: Date; // <--- THÊM DÒNG NÀY
}

Submission.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.STRING, allowNull: false },
  labId: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'solved' },
  flags: { type: DataTypes.TEXT, allowNull: true },
  fileUrl: { type: DataTypes.STRING, allowNull: true },
  adminComment: { type: DataTypes.TEXT, allowNull: true },
  startTime: { type: DataTypes.DATE, allowNull: true }
}, { sequelize, modelName: 'submission' });



// Thêm class Certificate
export class Certificate extends Model {
  declare id: number;
  declare hash: string;
  declare userId: string;
  declare examId: string;
  declare submissionId: number;
  declare signedName: string;
  declare issueDate: string;
  declare fileUrl: string;
}

// Khởi tạo bảng Certificate
Certificate.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  hash: { type: DataTypes.STRING, unique: true, allowNull: false },
  userId: { type: DataTypes.STRING, allowNull: false },
  examId: { type: DataTypes.STRING, allowNull: false },
  submissionId: { type: DataTypes.INTEGER, allowNull: false },
  signedName: { type: DataTypes.STRING, allowNull: true },
  issueDate: { type: DataTypes.STRING, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: true },
}, { sequelize, modelName: 'certificate' });

// ==========================================
// THÊM ĐOẠN NÀY VÀO PHẦN THIẾT LẬP QUAN HỆ
// ==========================================
User.hasMany(Certificate, { foreignKey: 'userId' });
Certificate.belongsTo(User, { foreignKey: 'userId' });

Lab.hasMany(Certificate, { foreignKey: 'examId' });
Certificate.belongsTo(Lab, { foreignKey: 'examId' });

Submission.hasOne(Certificate, { foreignKey: 'submissionId' });
Certificate.belongsTo(Submission, { foreignKey: 'submissionId' });



User.hasMany(Submission, { foreignKey: 'userId' });
Submission.belongsTo(User, { foreignKey: 'userId' });

Lab.hasMany(Submission, { foreignKey: 'labId' });
Submission.belongsTo(Lab, { foreignKey: 'labId' });

export class Lesson extends Model {
  declare id: string;
  declare title: string;
  declare title_en: string;
  declare description: string;
  declare description_en: string;
  declare category: string;
  declare difficulty: string;
  declare level: string;
  declare content: string;
  declare content_en: string;
  declare imageUrl: string;
  declare orderIndex: number;
}

Lesson.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  title_en: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT },
  description_en: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.STRING },
  difficulty: { type: DataTypes.STRING },
  level: { type: DataTypes.STRING },
  content: { type: DataTypes.TEXT },
  content_en: { type: DataTypes.TEXT, allowNull: true },
  imageUrl: { type: DataTypes.STRING },
  orderIndex: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { sequelize, modelName: 'lesson' });

export class LessonProgress extends Model {
  declare id: number;
  declare userId: string;
  declare lessonId: string;
  declare status: string;
  declare updatedAt: Date;
}

LessonProgress.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false },
  lessonId: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'reading' },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, modelName: 'lesson_progress', timestamps: true });

const addColumnIfMissing = async (table: string, column: string, def: string) => {
  try {
    await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${def}`);
    console.log(`  ✓ added column ${table}.${column}`);
  } catch (e: any) {
    const msg = e.message || e.parent?.message || '';
    if (!msg.includes('duplicate column')) console.error(e);
  }
};

export const initDb = async () => {
  try { await sequelize.query(`DROP TABLE IF EXISTS users_backup`); } catch {}
  await sequelize.sync();
  await addColumnIfMissing('labs', 'title_en', 'STRING');
  await addColumnIfMissing('labs', 'description_en', 'TEXT');
  await addColumnIfMissing('lessons', 'title_en', 'STRING');
  await addColumnIfMissing('lessons', 'description_en', 'TEXT');
  await addColumnIfMissing('lessons', 'content_en', 'TEXT');
};
