/**
 * Dataset del juego ¿Qué soy? — categorías de personajes y utilidades de barajado.
 *
 * Cada categoría agrupa palabras/nombres para mostrar en pantalla mientras
 * el resto del grupo adivina quién es el jugador.
 */

/** Claves de las categorías jugables (sin la opción "todas") */
export type WhoAmICategory =
  | 'politicos'
  | 'deportistas'
  | 'actores'
  | 'cantantes'
  | 'personajes_ficcion'
  | 'famosos_argentinos';

/** Categoría seleccionable en setup, incluyendo la mezcla de todas */
export type WhoAmICategorySelection = WhoAmICategory | 'todas';

interface WhoAmICategoryData {
  /** Etiqueta legible para mostrar en la UI */
  label: string;
  /** Nombres o personajes de la categoría */
  words: readonly string[];
}

/**
 * Mapa de categorías con sus palabras.
 * Las claves deben coincidir con el tipo WhoAmICategory.
 */
export const WHO_AM_I_CATEGORIES: Record<WhoAmICategory, WhoAmICategoryData> = {
  politicos: {
    label: 'Políticos',
    words: [
      'Obama',
      'Trump',
      'Milei',
      'Macri',
      'Kirchner',
      'Lula',
      'Maduro',
      'Putin',
      'Zelensky',
      'Xi Jinping',
      'Biden',
      'Merkel',
      'Thatcher',
      'Churchill',
      'Mao',
      'Hitler',
      'Napoleón',
      'Lincoln',
      'Bolsonaro',
      'Trudeau',
    ],
  },
  deportistas: {
    label: 'Deportistas',
    words: [
      'Messi',
      'Ronaldo',
      'Maradona',
      'Federer',
      'Nadal',
      'LeBron James',
      'Michael Jordan',
      'Usain Bolt',
      'Muhammad Ali',
      'Tiger Woods',
      'Pelé',
      'Neymar',
      'Mbappé',
      'Djokovic',
      'Serena Williams',
      'Michael Phelps',
      'Tyson',
      'Schumacher',
      'Valentino Rossi',
      'Manu Ginóbili',
    ],
  },
  actores: {
    label: 'Actores',
    words: [
      'Brad Pitt',
      'Leonardo DiCaprio',
      'Scarlett Johansson',
      'Angelina Jolie',
      'Tom Hanks',
      'Meryl Streep',
      'Johnny Depp',
      'Morgan Freeman',
      'Jennifer Aniston',
      'Will Smith',
      'Robert Downey Jr',
      'Keanu Reeves',
      'Dwayne Johnson',
      'Margot Robbie',
      'Tom Cruise',
      'Cate Blanchett',
      'Jack Nicholson',
      'Denzel Washington',
      'Julia Roberts',
      'Ryan Reynolds',
    ],
  },
  cantantes: {
    label: 'Cantantes',
    words: [
      'Michael Jackson',
      'Madonna',
      'Freddie Mercury',
      'Beyoncé',
      'Taylor Swift',
      'Lady Gaga',
      'Elvis Presley',
      'Adele',
      'Rihanna',
      'Shakira',
      'Bad Bunny',
      'Bizarrap',
      'Tini',
      'Paulo Londra',
      'The Weeknd',
      'Eminem',
      'David Bowie',
      'Amy Winehouse',
      'Billie Eilish',
      'Justin Bieber',
    ],
  },
  personajes_ficcion: {
    label: 'Personajes de ficción',
    words: [
      'Batman',
      'Superman',
      'Harry Potter',
      'Hermione',
      'Darth Vader',
      'Spiderman',
      'Iron Man',
      'Sherlock Holmes',
      'James Bond',
      'Indiana Jones',
      'Frodo',
      'Gandalf',
      'Jack Sparrow',
      'El Joker',
      'Walter White',
      'Homer Simpson',
      'Mickey Mouse',
      'Shrek',
      'Buzz Lightyear',
      'Katniss Everdeen',
    ],
  },
  famosos_argentinos: {
    label: 'Famosos argentinos',
    words: [
      'Susana Giménez',
      'Mirtha Legrand',
      'Marcelo Tinelli',
      'Fantino',
      'Jorge Lanata',
      'Guido Kaczka',
      'Lizy Tagliani',
      'Wanda Nara',
      'Pampita',
      'Nicole Neumann',
      'Flor de la V',
      'Andy Kusnetzoff',
      'Jey Mammón',
      'Fer Dente',
      'Roberto Moldavsky',
    ],
  },
};

/**
 * Baraja un array in-place con el algoritmo Fisher-Yates
 * y retorna una copia nueva barajada.
 */
const shuffleArray = <T>(items: readonly T[]): T[] => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
};

/**
 * Obtiene todas las palabras de una categoría concreta o la mezcla global.
 *
 * @param category - Categoría elegida o `'todas'` para combinar todo el dataset
 * @returns Array de palabras barajado aleatoriamente
 */
export const getShuffledCards = (category: WhoAmICategorySelection): string[] => {
  if (category === 'todas') {
    const allWords = Object.values(WHO_AM_I_CATEGORIES).flatMap(
      (categoryData) => categoryData.words,
    );
    return shuffleArray(allWords);
  }

  return shuffleArray(WHO_AM_I_CATEGORIES[category].words);
};

/**
 * Resuelve la etiqueta legible de una categoría para mostrar en la UI del juego.
 */
export const getCategoryLabel = (category: WhoAmICategorySelection): string => {
  if (category === 'todas') {
    return 'Todas mezcladas';
  }

  return WHO_AM_I_CATEGORIES[category].label;
};
