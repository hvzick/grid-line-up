export type MovieCategory = "hollywood" | "bollywood";

export const MOVIES: Record<MovieCategory, string[]> = {
  hollywood: [
    "The Terminator", "Titanic", "Inception", "Interstellar", "The Matrix", "Jurassic Park",
    "The Lion King", "Toy Story", "Finding Nemo", "The Avengers", "Iron Man", "Spider-Man",
    "The Dark Knight", "Forrest Gump", "The Godfather", "Home Alone", "Jaws", "Rocky",
    "Back to the Future", "Harry Potter", "The Hunger Games", "Frozen", "Avatar", "Gladiator",
    "La La Land", "The Notebook", "Pulp Fiction", "Shrek", "Coco", "Black Panther",
  ],
  bollywood: [
    "Sholay", "Dilwale Dulhania Le Jayenge", "Lagaan", "3 Idiots", "Dangal", "Zindagi Na Milegi Dobara",
    "Munna Bhai M B B S", "Queen", "Barfi", "Chak De India", "Taare Zameen Par", "Bajrangi Bhaijaan",
    "PK", "Andaz Apna Apna", "Kuch Kuch Hota Hai", "Kal Ho Naa Ho", "Mughal E Azam", "Deewaar",
    "Gully Boy", "Drishyam", "Hera Pheri", "Swades", "Jab We Met", "Om Shanti Om",
    "Kabhi Khushi Kabhie Gham", "Rang De Basanti", "Article 15", "Rockstar", "Pushpa", "Pathaan",
  ],
};

export function initialMovieHints(title: string) {
  return [...title].map((char) => (/[aeiou]/i.test(char) || !/[a-z]/i.test(char) ? char : ""));
}

export function normalizeMovie(title: string) {
  return title.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}
