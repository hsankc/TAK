export interface Opportunity {
  title: string;
  url: string;
  description?: string;
  deadline?: Date | null;
  category: 'hackathon' | 'scholarship' | 'education' | 'competition';
  source: 'youthall' | 'coderspace' | 'anbean';
}
