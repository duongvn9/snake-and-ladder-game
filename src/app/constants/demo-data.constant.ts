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
  { name: 'Bùi Tiên Phong', teamIndex: 0 },
  { name: 'Phạm Ngọc Hiển', teamIndex: 0 },
  { name: 'Đặng Trung Hiếu', teamIndex: 0 },
  { name: 'Nguyễn Công Thành', teamIndex: 0 },
  { name: 'Nguyễn Tuấn Vũ', teamIndex: 0 },
  
  // Team 2 (5 người)
  { name: 'Phạm Tuấn Linh', teamIndex: 1 },
  { name: 'Đặng Hoàng Lâm', teamIndex: 1 },
  { name: 'Phạm Minh Đức', teamIndex: 1 },
  { name: 'Nguyễn Thái Đông', teamIndex: 1 },
  { name: 'Lê Văn Dũng', teamIndex: 1 },
  
  // Team 3 (5 người)
  { name: 'Nguyễn Mạnh Trường', teamIndex: 2 },
  { name: 'Vũ Ngọc Dương', teamIndex: 2 },
  { name: 'Hoàng Dũng', teamIndex: 2 },
  { name: 'Nguyễn Quang Đức', teamIndex: 2 },
  { name: 'Hồ Anh Tuấn', teamIndex: 2 },
  
  // Team 4 (5 người)
  { name: 'Đỗ Xuân Hùng', teamIndex: 3 },
  { name: 'Vũ Dương Ngân', teamIndex: 3 },
  { name: 'Lê Quang Huy', teamIndex: 3 },
  { name: 'Vũ Danh Ninh', teamIndex: 3 },
  { name: 'Đoàn Thành Trung', teamIndex: 3 },
  
  // Team 5 (5 người)
  { name: 'Mai Quỳnh Trang', teamIndex: 4 },
  { name: 'Nguyễn Ngọc Diệp', teamIndex: 4 },
  { name: 'Bùi Thị Anh', teamIndex: 4 },
  { name: 'Nguyễn Thị Thùy Dung', teamIndex: 4 },
  { name: 'Nguyễn Thị Hoài Dung', teamIndex: 4 },
  
  // Team 6 (5 người)
  { name: 'Trần Thị Anh Thu', teamIndex: 5 },
  { name: 'Bùi Thị Tuyết Mai', teamIndex: 5 },
  { name: 'Nguyễn Thị Hoài Thu', teamIndex: 5 },
  { name: 'Đặng Thu Uyên', teamIndex: 5 },
  { name: 'Nguyễn Phương Liên', teamIndex: 5 },
  
  // Team 7 (4 người)
  { name: 'Trần Thị Yến', teamIndex: 6 },
  { name: 'Phạm Thị Thu Hằng', teamIndex: 6 },
  { name: 'Nguyễn Thanh Nga', teamIndex: 6 },
  { name: 'Nguyễn Thị Kiều Trang', teamIndex: 6 },
];

/**
 * Number of teams in demo data
 */
export const DEMO_TEAM_COUNT = 7;

/**
 * Total number of demo players
 */
export const DEMO_PLAYER_COUNT = DEMO_PLAYERS.length; // 34
