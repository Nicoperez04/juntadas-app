/**
 * Banco local de palabras para el juego Impostor.
 *
 * Categorías con al menos 25 términos cada una para sugerencias
 * y selección aleatoria sin depender del backend.
 */

/** Mapa categoría → lista de palabras en español */
export const WORD_BANK: Record<string, string[]> = {
  comida: [
    'Pizza', 'Empanada', 'Asado', 'Milanesa', 'Helado', 'Sushi', 'Taco', 'Paella',
    'Ravioles', 'Choripán', 'Humita', 'Locro', 'Fugazzeta', 'Provoleta', 'Chocotorta',
    'Alfajor', 'Medialuna', 'Factura', 'Guiso', 'Polenta', 'Ñoquis', 'Tarta', 'Ensalada',
    'Hamburguesa', 'Ramen', 'Croissant', 'Wok', 'Ceviche', 'Falafel', 'Burrito',
  ],
  bebidas: [
    'Mate', 'Café', 'Té', 'Gaseosa', 'Agua', 'Jugo', 'Smoothie', 'Limonada',
    'Cerveza', 'Vino', 'Fernet', 'Whisky', 'Champagne', 'Capuccino', 'Latte',
    'Milkshake', 'Agua con gas', 'Energizante', 'Submarino', 'Cortado', 'Espresso',
    'Malbec', 'Gin tonic', 'Aperol spritz', 'Cola', 'Sprite', 'Agua saborizada',
    'Infusión', 'Chocolate caliente', 'Batido', 'Kombucha',
  ],
  deportes: [
    'Fútbol', 'Básquet', 'Tenis', 'Rugby', 'Hockey', 'Vóley', 'Natación', 'Atletismo',
    'Boxeo', 'Golf', 'Surf', 'Skate', 'Ciclismo', 'Gimnasia', 'Handball', 'Paddle',
    'Esgrima', 'Karate', 'Judo', 'Motocross', 'Formula 1', 'Maratón', 'Triatlón',
    'Escalada', 'Snowboard', 'Esquí', 'Cricket', 'Beach vóley', 'Waterpolo', 'Patinaje',
  ],
  animales: [
    'Perro', 'Gato', 'León', 'Tigre', 'Elefante', 'Jirafa', 'Cebra', 'Oso',
    'Lobo', 'Zorro', 'Delfín', 'Ballena', 'Pingüino', 'Águila', 'Búho', 'Serpiente',
    'Cocodrilo', 'Tortuga', 'Caballo', 'Vaca', 'Cerdo', 'Oveja', 'Canguro', 'Koala',
    'Panda', 'Mono', 'Gorila', 'Flamenco', 'Colibrí', 'Camaleón', 'Murciélago',
  ],
  películas: [
    'Titanic', 'Avatar', 'Matrix', 'Gladiador', 'Inception', 'Interstellar', 'Joker',
    'Frozen', 'Toy Story', 'Shrek', 'Coco', 'Up', 'Ratatouille', 'Rocky', 'Rocky IV',
    'El Padrino', 'Pulp Fiction', 'Forrest Gump', 'Parásitos', 'Whiplash', 'Creed',
    'Top Gun', 'Barbie', 'Oppenheimer', 'Dune', 'Star Wars', 'Harry Potter', 'El Rey León',
    'Buscando a Nemo', 'Intensamente', 'Casa de Papel',
  ],
  series: [
    'Breaking Bad', 'Game of Thrones', 'Stranger Things', 'The Office', 'Friends',
    'The Crown', 'La Casa de Papel', 'Dark', 'Squid Game', 'The Witcher', 'Loki',
    'WandaVision', 'The Mandalorian', 'Peaky Blinders', 'Vikings', 'Narcos',
    'Better Call Saul', 'Black Mirror', 'The Boys', 'Euphoria', 'Wednesday',
    'El Marginal', 'Plataforma 7', 'El Chavo', 'Los Simpsons', 'Dragon Ball',
    'One Piece', 'Attack on Titan', 'Merlí', 'El Internado', 'Elite',
  ],
  música: [
    'Rock', 'Pop', 'Reggaetón', 'Cumbia', 'Tango', 'Jazz', 'Blues', 'Hip hop',
    'Trap', 'Electrónica', 'Metal', 'Punk', 'Folk', 'Salsa', 'Bachata', 'Merengue',
    'Reggae', 'Soul', 'R&B', 'Disco', 'Indie', 'K-pop', 'Opera', 'Clásica',
    'Bolero', 'Chamamé', 'Cuarteto', 'Dancehall', 'Grunge', 'Funk', 'Bossa nova',
  ],
  lugares: [
    'Playa', 'Montaña', 'Bosque', 'Desierto', 'Ciudad', 'Pueblo', 'Isla', 'Cascada',
    'Volcán', 'Caverna', 'Parque', 'Museo', 'Estadio', 'Teatro', 'Biblioteca',
    'Hospital', 'Aeropuerto', 'Estación', 'Puerto', 'Mercado', 'Plaza', 'Catedral',
    'Castillo', 'Ruinas', 'Glaciar', 'Selva', 'Pradera', 'Lago', 'Río', 'Océano',
    'Acantilado',
  ],
  profesiones: [
    'Médico', 'Enfermero', 'Profesor', 'Ingeniero', 'Abogado', 'Arquitecto', 'Chef',
    'Bombero', 'Policía', 'Piloto', 'Periodista', 'Dentista', 'Veterinario', 'Contador',
    'Programador', 'Diseñador', 'Fotógrafo', 'Músico', 'Actor', 'Electricista',
    'Plomero', 'Carpintero', 'Mecánico', 'Farmacéutico', 'Psicólogo', 'Científico',
    'Astronauta', 'Juez', 'Traductor', 'Bibliotecario', 'Barista',
  ],
  objetos_cotidianos: [
    'Llave', 'Teléfono', 'Reloj', 'Paraguas', 'Mochila', 'Cartera', 'Espejo', 'Peine',
    'Cepillo', 'Toalla', 'Almohada', 'Sábanas', 'Taza', 'Plato', 'Cuchara', 'Tenedor',
    'Cuchillo', 'Olla', 'Sartén', 'Ventilador', 'Lámpara', 'Velador', 'Escoba',
    'Balde', 'Escalera', 'Martillo', 'Destornillador', 'Tijeras', 'Cinta adhesiva',
    'Encendedor', 'Botella',
  ],
  naturaleza: [
    'Árbol', 'Flor', 'Roca', 'Nube', 'Arcoíris', 'Trueno', 'Relámpago', 'Viento',
    'Lluvia', 'Nieve', 'Granizo', 'Aurora', 'Eclipse', 'Marea', 'Corriente', 'Arrecife',
    'Musgo', 'Hongo', 'Semilla', 'Raíz', 'Hoja', 'Pétalo', 'Polen', 'Coral', 'Algas',
    'Duna', 'Oasis', 'Géiser', 'Delta', 'Cañón', 'Acantilado',
  ],
  tecnología: [
    'Computadora', 'Notebook', 'Tablet', 'Smartphone', 'Auriculares', 'Mouse', 'Teclado',
    'Monitor', 'Impresora', 'Router', 'Drone', 'Robot', 'Consola', 'Televisor', 'Cámara',
    'Micrófono', 'Parlante', 'Smartwatch', 'GPS', 'Satélite', 'Internet', 'WiFi', 'Bluetooth',
    'USB', 'SSD', 'Procesador', 'Placa de video', 'Realidad virtual', 'Inteligencia artificial',
    'Blockchain', 'App',
  ],
  ropa: [
    'Remera', 'Pantalón', 'Jean', 'Campera', 'Buzo', 'Vestido', 'Pollera', 'Short',
    'Medias', 'Zapatillas', 'Botas', 'Sandalias', 'Sombrero', 'Gorra', 'Bufanda',
    'Guantes', 'Corbata', 'Chaleco', 'Traje', 'Pijama', 'Bikini', 'Malla', 'Delantal',
    'Kimono', 'Poncho', 'Chalina', 'Cinturón', 'Anteojos', 'Reloj de pulsera', 'Anillo',
    'Collar',
  ],
  transportes: [
    'Auto', 'Colectivo', 'Subte', 'Tren', 'Avión', 'Barco', 'Bicicleta', 'Motocicleta',
    'Camión', 'Taxi', 'Uber', 'Monopatín', 'Helicóptero', 'Yate', 'Canoa', 'Kayak',
    'Submarino', 'Tranvía', 'Teleférico', 'Funicular', 'Carreta', 'Tractor', 'Ambulancia',
    'Patrullero', 'Bomberos', 'Cohete', 'Globo aerostático', 'Carroza', 'Skateboard',
    'Patines', 'Segway',
  ],
  videojuegos: [
    'Minecraft', 'Fortnite', 'GTA', 'FIFA', 'Call of Duty', 'Zelda', 'Mario', 'Pokémon',
    'Among Us', 'Roblox', 'Valorant', 'League of Legends', 'Counter-Strike', 'Overwatch',
    'The Sims', 'Animal Crossing', 'Hollow Knight', 'Celeste', 'Hades', 'Elden Ring',
    'God of War', 'Horizon', 'Red Dead', 'Assassin\'s Creed', 'Resident Evil', 'Final Fantasy',
    'Street Fighter', 'Tekken', 'Rocket League', 'Fall Guys', 'Stardew Valley',
  ],
  países: [
    'Argentina', 'Brasil', 'Chile', 'Uruguay', 'Paraguay', 'Bolivia', 'Perú', 'Colombia',
    'México', 'España', 'Francia', 'Italia', 'Alemania', 'Inglaterra', 'Portugal',
    'Estados Unidos', 'Canadá', 'Japón', 'China', 'Corea del Sur', 'India', 'Australia',
    'Nueva Zelanda', 'Egipto', 'Marruecos', 'Sudáfrica', 'Turquía', 'Grecia', 'Suecia',
    'Noruega', 'Islandia',
  ],
  historia: [
    'Imperio Romano', 'Renacimiento', 'Revolución Francesa', 'Independencia', 'Guerra Mundial',
    'Guerra Fría', 'Pirámides', 'Coliseo', 'Muralla China', 'Edad Media', 'Edad de Oro',
    'Descubrimiento de América', 'Revolución Industrial', 'Imperio Bizantino', 'Vikingos',
    'Samuráis', 'Caballeros', 'Feudalismo', 'Ilustración', 'Monarquía', 'República',
    'Democracia', 'Esclavitud', 'Abolición', 'Holocaust', 'Apolo 11', 'Caída del Muro',
    'Antiguo Egipto', 'Mesopotamia', 'Imperio Otomano', 'Conquista',
  ],
  ciencia: [
    'Átomo', 'Molécula', 'ADN', 'Gen', 'Célula', 'Bacteria', 'Virus', 'Gravedad',
    'Electricidad', 'Magnetismo', 'Luz', 'Sonido', 'Energía', 'Fotosíntesis', 'Evolución',
    'Big Bang', 'Agujero negro', 'Planeta', 'Estrella', 'Galaxia', 'Telescopio', 'Microscopio',
    'Química', 'Física', 'Biología', 'Geología', 'Meteorología', 'Ecología', 'Vacuna',
    'Antibiótico', 'Radiación',
  ],
  marcas_conocidas: [
    'Nike', 'Adidas', 'Apple', 'Samsung', 'Google', 'Microsoft', 'Amazon', 'Netflix',
    'Spotify', 'Coca-Cola', 'Pepsi', 'McDonald\'s', 'Starbucks', 'Toyota', 'Mercedes',
    'BMW', 'Ferrari', 'Disney', 'Lego', 'PlayStation', 'Xbox', 'Nintendo', 'Instagram',
    'WhatsApp', 'TikTok', 'YouTube', 'Twitter', 'Uber', 'Airbnb', 'Tesla', 'Red Bull',
  ],
  arte: [
    'Pintura', 'Escultura', 'Fotografía', 'Danza', 'Teatro', 'Ópera', 'Mural', 'Graffiti',
    'Acuarela', 'Óleo', 'Dibujo', 'Collage', 'Instalación', 'Performance', 'Cerámica',
    'Origami', 'Caligrafía', 'Grabado', 'Litografía', 'Bordado', 'Vitral', 'Mosaico',
    'Arte digital', 'Cine', 'Animación', 'Comic', 'Manga', 'Caricatura', 'Retrato',
    'Paisaje', 'Abstracto',
  ],
};

/** Lista ordenada de claves de categoría disponibles */
export const CATEGORIES = Object.keys(WORD_BANK);

/** Etiquetas en español para mostrar en la UI */
const CATEGORY_LABELS: Record<string, string> = {
  comida: 'Comida',
  bebidas: 'Bebidas',
  deportes: 'Deportes',
  animales: 'Animales',
  películas: 'Películas',
  series: 'Series',
  música: 'Música',
  lugares: 'Lugares',
  profesiones: 'Profesiones',
  objetos_cotidianos: 'Objetos cotidianos',
  naturaleza: 'Naturaleza',
  tecnología: 'Tecnología',
  ropa: 'Ropa',
  transportes: 'Transportes',
  videojuegos: 'Videojuegos',
  países: 'Países',
  historia: 'Historia',
  ciencia: 'Ciencia',
  marcas_conocidas: 'Marcas conocidas',
  arte: 'Arte',
};

/**
 * Devuelve el nombre legible en español de una categoría.
 *
 * @param key - Clave interna de la categoría
 * @returns Etiqueta para chips y títulos
 */
export const getCategoryLabel = (key: string): string =>
  CATEGORY_LABELS[key] ?? key;

/**
 * Elige una palabra aleatoria de la categoría indicada.
 *
 * @param category - Clave de categoría del WORD_BANK
 * @returns Palabra aleatoria o cadena vacía si la categoría no existe
 */
export const getRandomWord = (category: string): string => {
  const words = WORD_BANK[category];
  if (!words || words.length === 0) return '';
  const index = Math.floor(Math.random() * words.length);
  return words[index];
};

/**
 * Devuelve un subconjunto aleatorio de palabras sugeridas para una categoría.
 *
 * @param category - Clave de categoría
 * @param count - Cantidad de sugerencias (default 6)
 * @returns Array de palabras sin repetir, hasta `count` elementos
 */
export const getWordSuggestions = (category: string, count = 6): string[] => {
  const words = WORD_BANK[category];
  if (!words || words.length === 0) return [];

  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

/** Resultado de una selección aleatoria de palabra */
export interface WordPickResult {
  /** Palabra elegida */
  word: string;
  /** Clave de categoría de origen */
  category: string;
}

/**
 * Elige un elemento aleatorio de un pool evitando palabras ya usadas.
 * Si el pool filtrado queda vacío, permite repetición como último recurso.
 */
const pickFromPool = (pool: string[], exclude: string[]): string => {
  const available = pool.filter((word) => !exclude.includes(word));
  const source = available.length > 0 ? available : pool;
  return source[Math.floor(Math.random() * source.length)];
};

/**
 * Elige palabra aleatoria de una categoría evitando las ya usadas en la sesión.
 *
 * @param category - Clave de categoría
 * @param exclude - Palabras a no repetir
 */
export const pickRandomWordFromCategory = (
  category: string,
  exclude: string[] = [],
): WordPickResult | null => {
  const words = WORD_BANK[category];
  if (!words || words.length === 0) return null;
  return { word: pickFromPool(words, exclude), category };
};

/**
 * Elige palabra aleatoria de cualquier categoría manteniendo el misterio del tema.
 *
 * @param exclude - Palabras ya usadas en la sesión actual
 */
export const pickRandomWordFromAllCategories = (
  exclude: string[] = [],
): WordPickResult => {
  const shuffledCategories = [...CATEGORIES].sort(() => Math.random() - 0.5);

  for (const category of shuffledCategories) {
    const words = WORD_BANK[category].filter((word) => !exclude.includes(word));
    if (words.length > 0) {
      return {
        word: words[Math.floor(Math.random() * words.length)],
        category,
      };
    }
  }

  const fallbackCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  return {
    word: getRandomWord(fallbackCategory),
    category: fallbackCategory,
  };
};

/** Modo de selección para el helper unificado */
export type WordPickMode = 'all_categories' | 'specific_category';

/**
 * Selecciona palabra según el modo elegido por el organizador.
 *
 * @param mode - Todas las categorías o una específica
 * @param category - Categoría requerida si mode es specific_category
 * @param exclude - Historial de palabras de la sesión
 */
export const pickWordForMode = (
  mode: WordPickMode,
  category: string | null,
  exclude: string[] = [],
): WordPickResult => {
  if (mode === 'specific_category' && category) {
    return (
      pickRandomWordFromCategory(category, exclude) ??
      pickRandomWordFromAllCategories(exclude)
    );
  }
  return pickRandomWordFromAllCategories(exclude);
};

/** Pistas genéricas por categoría — no revelan la palabra exacta */
const CATEGORY_HINT_TEMPLATES: Record<string, string[]> = {
  comida: ['Es comestible', 'Se come en una comida', 'Es algo que podés cocinar'],
  bebidas: ['Es líquido', 'Se bebe', 'Va en un vaso'],
  deportes: ['Es una actividad física', 'Se practica con esfuerzo', 'Puede ser en equipo'],
  animales: ['Es un ser vivo', 'Tiene patas o aletas', 'Vive en la naturaleza'],
  películas: ['Es una película', 'Se ve en el cine', 'Tiene actores'],
  series: ['Es una serie', 'Tiene episodios', 'Se ve en streaming'],
  música: ['Es un género musical', 'Se escucha', 'Tiene ritmo'],
  lugares: ['Es un lugar', 'Podés visitarlo', 'Ocupa un espacio'],
  profesiones: ['Es un trabajo', 'Alguien lo hace profesionalmente', 'Requiere habilidades'],
  objetos_cotidianos: ['Es un objeto común', 'Lo usás en el día a día', 'Está en una casa'],
  naturaleza: ['Es de la naturaleza', 'Existe sin intervención humana', 'Está al aire libre'],
  tecnología: ['Es tecnológico', 'Usa electricidad o digital', 'Es moderno'],
  ropa: ['Es una prenda', 'Te lo ponés', 'Protege del frío o calor'],
  transportes: ['Sirve para transportarse', 'Te movés con esto', 'Tiene ruedas o motor'],
  videojuegos: ['Es un videojuego', 'Se juega en pantalla', 'Tiene niveles o misiones'],
  países: ['Es un país', 'Está en un mapa', 'Tiene bandera propia'],
  historia: ['Es un hecho histórico', 'Pasó en el pasado', 'Se estudia en la escuela'],
  ciencia: ['Es un concepto científico', 'Se estudia en laboratorio', 'Tiene que ver con la ciencia'],
  marcas_conocidas: ['Es una marca conocida', 'La ves en publicidad', 'Es muy popular'],
  arte: ['Es una forma de arte', 'Requiere creatividad', 'Se exhibe o se interpreta'],
};

/**
 * Genera una pista automática para el impostor sin revelar la palabra.
 *
 * @param word - Palabra secreta de la ronda
 * @param category - Clave de categoría de origen
 * @param showCategory - Si el tema es público para el grupo
 */
export const generateImpostorHint = (
  word: string,
  category: string,
  showCategory: boolean,
): string => {
  const candidates: string[] = [];

  const cleanWord = word.trim();
  if (cleanWord.length > 0) {
    const letterCount = cleanWord.replace(/\s/g, '').length;
    candidates.push(`Tiene ${letterCount} letras`);
    candidates.push(`Empieza con "${cleanWord[0].toUpperCase()}"`);
  }

  if (showCategory) {
    candidates.push(`Pertenece a ${getCategoryLabel(category)}`);
  }

  const categoryHints = CATEGORY_HINT_TEMPLATES[category];
  if (categoryHints) {
    candidates.push(categoryHints[Math.floor(Math.random() * categoryHints.length)]);
  }

  if (candidates.length === 0) {
    return 'Pensá en algo relacionado con el tema de la ronda';
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
};
