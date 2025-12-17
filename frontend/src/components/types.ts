// src/components/types.ts
export type Vak = {
  id: string;
  naam: string;
  categorie: string;
  gradient: string;
  tutor: {
    naam: string;
    avatar: string;
    instructies: string;
    boek: string;
  };
};