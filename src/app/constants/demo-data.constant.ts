/**
 * Demo data for testing - 34 players divided into 7 teams (5-5-5-5-5-5-4)
 * Requirements: 14.2
 */

export interface DemoPlayer {
  name: string;
  teamIndex: number; // 0-6 (7 teams)
}

/**
 * 34 demo players for testing
 * Divided into 7 teams: 5-5-5-5-5-5-4
 */
export const DEMO_PLAYERS: DemoPlayer[] = [
  // Team 1 (5 người)
  { name: 'Mr. Phong', teamIndex: 0 },
  { name: 'Mr. Hiển', teamIndex: 0 },
  { name: 'Mr. Hiếu', teamIndex: 0 },
  { name: 'Mr. Thành', teamIndex: 0 },
  { name: 'Mr. Vũ', teamIndex: 0 },
  
  // Team 2 (5 người)
  { name: 'Mr. Linh', teamIndex: 1 },
  { name: 'Mr. Lâm', teamIndex: 1 },
  { name: 'Mr. Đức Soft', teamIndex: 1 },
  { name: 'Mr. Đông', teamIndex: 1 },
  { name: 'Mr. Dũng Soft', teamIndex: 1 },
  
  // Team 3 (5 người)
  { name: 'Mr. Trường', teamIndex: 2 },
  { name: 'Mr. Dương', teamIndex: 2 },
  { name: 'Mr. Dũng BOD', teamIndex: 2 },
  { name: 'Mr. Đức BOD', teamIndex: 2 },
  { name: 'Mr. Tuấn', teamIndex: 2 },
  
  // Team 4 (5 người)
  { name: 'Mr. Hùng', teamIndex: 3 },
  { name: 'Mr. Ngân', teamIndex: 3 },
  { name: 'Mr. Huy', teamIndex: 3 },
  { name: 'Mr. Ninh', teamIndex: 3 },
  { name: 'Mr. Trung', teamIndex: 3 },
  
  // Team 5 (5 người)
  { name: 'Ms. Trang LIB', teamIndex: 4 },
  { name: 'Ms. Diệp', teamIndex: 4 },
  { name: 'Ms. Bùi Anh', teamIndex: 4 },
  { name: 'Ms. Thùy Dung', teamIndex: 4 },
  { name: 'Ms. Hoài Dung', teamIndex: 4 },
  
  // Team 6 (5 người)
  { name: 'Ms. Thu Soft', teamIndex: 5 },
  { name: 'Ms. Mai', teamIndex: 5 },
  { name: 'Ms. Thu KT', teamIndex: 5 },
  { name: 'Ms. Uyên', teamIndex: 5 },
  { name: 'Ms. Liên', teamIndex: 5 },
  
  // Team 7 (4 người)
  { name: 'Ms. Yến', teamIndex: 6 },
  { name: 'Ms. Hằng', teamIndex: 6 },
  { name: 'Ms. Nga', teamIndex: 6 },
  { name: 'Ms. Trang KT', teamIndex: 6 },
];

/**
 * Number of teams in demo data
 */
export const DEMO_TEAM_COUNT = 7;

/**
 * Total number of demo players
 */
export const DEMO_PLAYER_COUNT = DEMO_PLAYERS.length; // 34
