
export function generateUsnRange(usnList: string): string[] {
  const lines = usnList.split('\n').map(line => line.trim()).filter(line => line);
  const students: Set<string> = new Set();
  
  for (const line of lines) {
    if (line.includes(' to ')) {
      const parts = line.split(' to ');
      const startStr = parts[0];
      const endStr = parts[1];
      
      const prefix = startStr.slice(0, -3);
      const startNum = parseInt(startStr.slice(-3), 10);
      const endNum = parseInt(endStr.slice(-3), 10);
      
      if (prefix === endStr.slice(0, -3) && !isNaN(startNum) && !isNaN(endNum) && startNum <= endNum) {
        for (let i = startNum; i <= endNum; i++) {
          students.add(`${prefix}${String(i).padStart(3, '0')}`);
        }
      } else {
        students.add(line);
      }
    } else {
      students.add(line);
    }
  }
  return Array.from(students).sort();
}

export function parseUsnList(usnList: string): string[] {
  const students = usnList
    .split('\n')
    .map(line => line.trim().toUpperCase())
    .filter(line => line);
  return [...new Set(students)].sort();
}
