// World Cup 2026 — Key Players by National Team
// 48 teams × 3–5 key players each
const PLAYERS = {
  // Group A
  'Mexico': [
    { name: 'Raúl Jiménez', position: 'ST', club: 'Fulham', number: 9, age: 34 },
    { name: 'Edson Álvarez', position: 'CDM/CB', club: 'West Ham', number: 4, age: 27 },
    { name: 'Hirving Lozano', position: 'LW', club: 'PSV', number: 22, age: 29 },
    { name: 'Guillermo Ochoa', position: 'GK', club: 'Salernitana', number: 13, age: 39 },
    { name: 'Santiago Giménez', position: 'ST', club: 'Feyenoord', number: 20, age: 24 }
  ],
  'South Africa': [
    { name: 'Percy Tau', position: 'LW/ST', club: 'Al Ahly', number: 10, age: 31 },
    { name: 'Lyle Foster', position: 'ST', club: 'Burnley', number: 17, age: 24 },
    { name: 'Teboho Mokoena', position: 'CM', club: 'Mamelodi Sundowns', number: 4, age: 27 },
    { name: 'Rowen Williams', position: 'GK', club: 'Mamelodi Sundowns', number: 1, age: 37 }
  ],
  'Korea Republic': [
    { name: 'Son Heung-min', position: 'LW/ST', club: 'Tottenham', number: 7, age: 32 },
    { name: 'Kim Min-jae', position: 'CB', club: 'Bayern Munich', number: 4, age: 28 },
    { name: 'Lee Kang-in', position: 'AM/RW', club: 'PSG', number: 18, age: 24 },
    { name: 'Hwang Hee-chan', position: 'LW/RW', club: 'Wolves', number: 11, age: 29 },
    { name: 'Cho Gue-sung', position: 'ST', club: 'Midtjylland', number: 9, age: 27 }
  ],
  'Czechia': [
    { name: 'Patrik Schick', position: 'ST', club: 'Bayer Leverkusen', number: 14, age: 29 },
    { name: 'Tomáš Souček', position: 'CDM/CM', club: 'West Ham', number: 8, age: 30 },
    { name: 'Vladimír Coufal', position: 'RB', club: 'West Ham', number: 5, age: 32 },
    { name: 'Antonín Barák', position: 'CM/AM', club: 'Fiorentina', number: 10, age: 29 },
    { name: 'Milan Havel', position: 'CB', club: 'Slavia Prague', number: 3, age: 30 }
  ],

  // Group B
  'Canada': [
    { name: 'Alphonso Davies', position: 'LB/LW', club: 'Bayern Munich', number: 19, age: 25 },
    { name: 'Jonathan David', position: 'ST', club: 'Lille', number: 20, age: 25 },
    { name: 'Stephen Eustáquio', position: 'CM', club: 'Porto', number: 8, age: 28 },
    { name: 'Cyle Larin', position: 'ST', club: 'Mallorca', number: 17, age: 30 },
    { name: 'Tajon Buchanan', position: 'RW/RM', club: 'Inter Milan', number: 11, age: 26 }
  ],
  'Bosnia and Herzegovina': [
    { name: 'Edin Džeko', position: 'ST', club: 'Fenerbahçe', number: 11, age: 39 },
    { name: 'Miralem Pjanić', position: 'CM', club: 'CSKA Moscow', number: 10, age: 35 },
    { name: 'Sead Kolašinac', position: 'LB/CB', club: 'Atalanta', number: 4, age: 32 },
    { name: 'Amar Dedić', position: 'RB', club: 'RB Salzburg', number: 5, age: 22 }
  ],
  'Qatar': [
    { name: 'Akram Afif', position: 'LW/ST', club: 'Al Sadd', number: 11, age: 28 },
    { name: 'Almoez Ali', position: 'ST', club: 'Al Duhail', number: 19, age: 28 },
    { name: 'Abdelkarim Hassan', position: 'LB', club: 'Al Sadd', number: 3, age: 31 },
    { name: 'Bassam Al-Rawi', position: 'CB', club: 'Al Rayyan', number: 15, age: 27 }
  ],
  'Switzerland': [
    { name: 'Granit Xhaka', position: 'CDM/CM', club: 'Bayer Leverkusen', number: 10, age: 32 },
    { name: 'Manuel Akanji', position: 'CB', club: 'Manchester City', number: 5, age: 29 },
    { name: 'Xherdan Shaqiri', position: 'RW/AM', club: 'Chicago Fire', number: 23, age: 33 },
    { name: 'Breel Embolo', position: 'ST', club: 'Monaco', number: 7, age: 28 },
    { name: 'Ricardo Rodríguez', position: 'LB', club: 'Torino', number: 13, age: 32 }
  ],

  // Group C
  'Brazil': [
    { name: 'Vinícius Júnior', position: 'LW', club: 'Real Madrid', number: 10, age: 24 },
    { name: 'Rodrygo', position: 'RW/AM', club: 'Real Madrid', number: 11, age: 24 },
    { name: 'Raphinha', position: 'RW', club: 'Barcelona', number: 22, age: 28 },
    { name: 'Marquinhos', position: 'CB', club: 'PSG', number: 4, age: 31 },
    { name: 'Alisson', position: 'GK', club: 'Liverpool', number: 1, age: 32 }
  ],
  'Morocco': [
    { name: 'Achraf Hakimi', position: 'RB', club: 'PSG', number: 2, age: 26 },
    { name: 'Noussair Mazraoui', position: 'LB/RB', club: 'Manchester United', number: 3, age: 27 },
    { name: 'Sofyan Amrabat', position: 'CDM', club: 'Fenerbahçe', number: 4, age: 28 },
    { name: 'Hakim Ziyech', position: 'RW/AM', club: 'Galatasaray', number: 7, age: 32 },
    { name: 'Youssef En-Nesyri', position: 'ST', club: 'Fenerbahçe', number: 19, age: 28 }
  ],
  'Haiti': [
    { name: 'Duckens Nazon', position: 'ST', club: 'CSKA Sofia', number: 9, age: 31 },
    { name: 'Frantzdy Pierrot', position: 'ST', club: 'Maccabi Haifa', number: 20, age: 30 },
    { name: 'Ricardo Adé', position: 'CB', club: 'Lorient', number: 4, age: 35 },
    { name: 'Bryan Alceus', position: 'CM', club: 'Olympiacos', number: 8, age: 26 }
  ],
  'Scotland': [
    { name: 'Andy Robertson', position: 'LB', club: 'Liverpool', number: 3, age: 31 },
    { name: 'Kieran Tierney', position: 'LB/CB', club: 'Real Sociedad', number: 6, age: 28 },
    { name: 'John McGinn', position: 'CM', club: 'Aston Villa', number: 7, age: 30 },
    { name: 'Scott McTominay', position: 'CM', club: 'Napoli', number: 8, age: 28 },
    { name: 'Che Adams', position: 'ST', club: 'Torino', number: 10, age: 28 }
  ],

  // Group D
  'USA': [
    { name: 'Christian Pulišić', position: 'LW/AM', club: 'AC Milan', number: 10, age: 26 },
    { name: 'Weston McKennie', position: 'CM', club: 'Juventus', number: 8, age: 26 },
    { name: 'Tyler Adams', position: 'CDM', club: 'Bournemouth', number: 4, age: 26 },
    { name: 'Gio Reyna', position: 'AM/RW', club: 'Borussia Dortmund', number: 7, age: 22 },
    { name: 'Folarin Balogun', position: 'ST', club: 'Monaco', number: 20, age: 23 }
  ],
  'Paraguay': [
    { name: 'Miguel Almirón', position: 'RW/AM', club: 'Newcastle', number: 10, age: 31 },
    { name: 'Ángel Romero', position: 'LW', club: 'Corinthians', number: 11, age: 32 },
    { name: 'Gustavo Gómez', position: 'CB', club: 'Palmeiras', number: 15, age: 32 },
    { name: 'Alejandro Romero', position: 'ST', club: 'Al Ain', number: 9, age: 29 }
  ],
  'Australia': [
    { name: 'Mathew Ryan', position: 'GK', club: 'AZ Alkmaar', number: 1, age: 33 },
    { name: 'Harry Souttar', position: 'CB', club: 'Leicester City', number: 4, age: 26 },
    { name: 'Jackson Irvine', position: 'CM', club: 'St. Pauli', number: 22, age: 32 },
    { name: 'Craig Goodwin', position: 'LW', club: 'Adelaide United', number: 23, age: 33 },
    { name: 'Riley McGree', position: 'CAM', club: 'Middlesbrough', number: 14, age: 26 }
  ],
  'Türkiye': [
    { name: 'Hakan Çalhanoğlu', position: 'CM', club: 'Inter Milan', number: 10, age: 31 },
    { name: 'Arda Güler', position: 'AM/RW', club: 'Real Madrid', number: 24, age: 20 },
    { name: 'Kenan Yıldız', position: 'LW/AM', club: 'Juventus', number: 15, age: 19 },
    { name: 'Çağlar Söyüncü', position: 'CB', club: 'Atlético Madrid', number: 4, age: 29 },
    { name: 'Merih Demiral', position: 'CB', club: 'Al Ahli', number: 3, age: 27 }
  ],

  // Group E
  'Germany': [
    { name: 'Jamal Musiala', position: 'AM/LW', club: 'Bayern Munich', number: 10, age: 22 },
    { name: 'Florian Wirtz', position: 'AM', club: 'Bayer Leverkusen', number: 17, age: 22 },
    { name: 'İlkay Gündoğan', position: 'CM', club: 'Barcelona', number: 8, age: 34 },
    { name: 'Antonio Rüdiger', position: 'CB', club: 'Real Madrid', number: 2, age: 32 },
    { name: 'Niclas Füllkrug', position: 'ST', club: 'West Ham', number: 14, age: 32 }
  ],
  'Curaçao': [
    { name: 'Juninho Bacuna', position: 'CM', club: 'Birmingham City', number: 8, age: 27 },
    { name: 'Leandro Bacuna', position: 'RB/CM', club: 'Groningen', number: 7, age: 33 },
    { name: 'Denzel Dumfries', position: 'RB', club: 'Inter Milan', number: 22, age: 29 }, 
    { name: 'Charlison Benschop', position: 'ST', club: 'Bordeaux', number: 9, age: 36 }
  ],
  "Côte d'Ivoire": [
    { name: 'Sébastien Haller', position: 'ST', club: 'Borussia Dortmund', number: 9, age: 31 },
    { name: 'Franck Kessié', position: 'CM', club: 'Al Ahli', number: 8, age: 28 },
    { name: 'Wilfried Singo', position: 'RB', club: 'Monaco', number: 17, age: 24 },
    { name: 'Evan Ndicka', position: 'CB', club: 'Roma', number: 5, age: 25 },
    { name: 'Jérémie Boga', position: 'LW', club: 'Nice', number: 23, age: 28 }
  ],
  'Ecuador': [
    { name: 'Moises Caicedo', position: 'CDM/CM', club: 'Chelsea', number: 23, age: 23 },
    { name: 'Enner Valencia', position: 'ST', club: 'Fenerbahçe', number: 13, age: 35 },
    { name: 'Pervis Estupiñán', position: 'LB', club: 'Brighton', number: 3, age: 27 },
    { name: 'Jeremy Sarmiento', position: 'LW/AM', club: 'Ipswich Town', number: 10, age: 22 },
    { name: 'Pier Hincapié', position: 'CB', club: 'Bayer Leverkusen', number: 2, age: 23 }
  ],

  // Group F
  'Netherlands': [
    { name: 'Virgil van Dijk', position: 'CB', club: 'Liverpool', number: 4, age: 33 },
    { name: 'Frenkie de Jong', position: 'CM', club: 'Barcelona', number: 21, age: 28 },
    { name: 'Cody Gakpo', position: 'LW/ST', club: 'Liverpool', number: 11, age: 26 },
    { name: 'Xavi Simons', position: 'AM', club: 'RB Leipzig', number: 7, age: 22 },
    { name: 'Jeremie Frimpong', position: 'RB/RW', club: 'Bayer Leverkusen', number: 22, age: 24 }
  ],
  'Japan': [
    { name: 'Takefusa Kubo', position: 'RW/AM', club: 'Real Sociedad', number: 14, age: 24 },
    { name: 'Ritsu Dōan', position: 'RW/LW', club: 'Freiburg', number: 10, age: 27 },
    { name: 'Wataru Endō', position: 'CDM', club: 'Liverpool', number: 6, age: 32 },
    { name: 'Takehiro Tomiyasu', position: 'CB/RB', club: 'Arsenal', number: 16, age: 26 },
    { name: 'Kaoru Mitoma', position: 'LW', club: 'Brighton', number: 21, age: 28 }
  ],
  'Sweden': [
    { name: 'Alexander Isak', position: 'ST', club: 'Newcastle', number: 9, age: 25 },
    { name: 'Dejan Kulusevski', position: 'RW/AM', club: 'Tottenham', number: 21, age: 25 },
    { name: 'Viktor Gyökeres', position: 'ST', club: 'Sporting CP', number: 11, age: 27 },
    { name: 'Emil Forsberg', position: 'LW/AM', club: 'RB Leipzig', number: 10, age: 33 },
    { name: 'Victor Lindelöf', position: 'CB', club: 'Manchester United', number: 3, age: 31 }
  ],
  'Tunisia': [
    { name: 'Wahbi Khazri', position: 'RW/AM', club: 'Montpellier', number: 10, age: 34 },
    { name: 'Ellyes Skhiri', position: 'CDM/CM', club: 'Eintracht Frankfurt', number: 14, age: 30 },
    { name: 'Youssef Msakni', position: 'LW/ST', club: 'Al Arabi', number: 7, age: 34 },
    { name: 'Ali Abdi', position: 'LB', club: 'Caen', number: 3, age: 31 },
    { name: 'Aïssa Laïdouni', position: 'CM', club: 'Al Wakrah', number: 17, age: 28 }
  ],

  // Group G
  'Belgium': [
    { name: 'Kevin De Bruyne', position: 'CM/AM', club: 'Manchester City', number: 7, age: 33 },
    { name: 'Romelu Lukaku', position: 'ST', club: 'Napoli', number: 10, age: 32 },
    { name: 'Jeremy Doku', position: 'RW', club: 'Manchester City', number: 22, age: 23 },
    { name: 'Youri Tielemans', position: 'CM', club: 'Aston Villa', number: 8, age: 28 },
    { name: 'Jan Vertonghen', position: 'CB', club: 'Anderlecht', number: 5, age: 38 }
  ],
  'Egypt': [
    { name: 'Mohamed Salah', position: 'RW', club: 'Liverpool', number: 10, age: 33 },
    { name: 'Mohamed Elneny', position: 'CDM/CM', club: 'Arsenal', number: 17, age: 32 },
    { name: 'Omar Marmoush', position: 'LW/ST', club: 'Eintracht Frankfurt', number: 7, age: 26 },
    { name: 'Mostafa Mohamed', position: 'ST', club: 'Nantes', number: 9, age: 27 },
    { name: 'Ahmed Hegazi', position: 'CB', club: 'Al Ittihad', number: 6, age: 34 }
  ],
  'IR Iran': [
    { name: 'Mehdi Taremi', position: 'ST', club: 'Inter Milan', number: 9, age: 32 },
    { name: 'Sardar Azmoun', position: 'ST', club: 'Roma', number: 20, age: 30 },
    { name: 'Milad Mohammadi', position: 'LB', club: 'AEK Athens', number: 3, age: 31 },
    { name: 'Alireza Beiranvand', position: 'GK', club: 'Persepolis', number: 1, age: 32 },
    { name: 'Saeid Ezatolahi', position: 'CDM', club: 'Al Ahli', number: 6, age: 27 }
  ],
  'New Zealand': [
    { name: 'Chris Wood', position: 'ST', club: 'Nottingham Forest', number: 9, age: 33 },
    { name: 'Winston Reid', position: 'CB', club: 'Free Agent', number: 2, age: 36 },
    { name: 'Liberato Cacace', position: 'LB', club: 'Empoli', number: 13, age: 24 },
    { name: 'Joe Tuima', position: 'CM', club: 'PEC Zwolle', number: 14, age: 23 },
    { name: 'Alex Greive', position: 'LW/ST', club: 'St Mirren', number: 7, age: 25 }
  ],

  // Group H
  'Spain': [
    { name: 'Pedri', position: 'CM', club: 'Barcelona', number: 8, age: 22 },
    { name: 'Rodri', position: 'CDM', club: 'Manchester City', number: 16, age: 29 },
    { name: 'Lamine Yamal', position: 'RW', club: 'Barcelona', number: 19, age: 18 },
    { name: 'Nico Williams', position: 'LW', club: 'Athletic Bilbao', number: 11, age: 22 },
    { name: 'Dani Carvajal', position: 'RB', club: 'Real Madrid', number: 2, age: 33 }
  ],
  'Cabo Verde': [
    { name: 'Ryan Mendes', position: 'RW', club: 'Fatih Karagümrük', number: 7, age: 35 },
    { name: 'Jamiro Monteiro', position: 'CM', club: 'Philadelphia Union', number: 8, age: 31 },
    { name: 'Garry Rodrigues', position: 'LW', club: 'Al Tai', number: 10, age: 34 },
    { name: 'Logan Costa', position: 'CB', club: 'Toulouse', number: 3, age: 24 }
  ],
  'Saudi Arabia': [
    { name: 'Salem Al-Dawsari', position: 'LW', club: 'Al Hilal', number: 10, age: 33 },
    { name: 'Feras Al-Brikan', position: 'ST', club: 'Al Hilal', number: 11, age: 26 },
    { name: 'Mohamed Kanno', position: 'CM', club: 'Al Hilal', number: 8, age: 30 },
    { name: 'Saud Abdulhamid', position: 'RB', club: 'Al Hilal', number: 2, age: 25 },
    { name: 'Yasser Al-Shahrani', position: 'LB', club: 'Al Hilal', number: 13, age: 33 }
  ],
  'Uruguay': [
    { name: 'Federico Valverde', position: 'CM', club: 'Real Madrid', number: 15, age: 26 },
    { name: 'Darwin Núñez', position: 'ST', club: 'Liverpool', number: 9, age: 25 },
    { name: 'Ronald Araújo', position: 'CB', club: 'Barcelona', number: 4, age: 26 },
    { name: 'Manuel Ugarte', position: 'CDM', club: 'Manchester United', number: 5, age: 24 },
    { name: 'Facundo Pellistri', position: 'RW', club: 'Manchester United', number: 21, age: 23 }
  ],

  // Group I
  'France': [
    { name: 'Kylian Mbappé', position: 'ST/LW', club: 'Real Madrid', number: 10, age: 26 },
    { name: 'Antoine Griezmann', position: 'AM/RW', club: 'Atlético Madrid', number: 7, age: 34 },
    { name: 'Eduardo Camavinga', position: 'CM/CDM', club: 'Real Madrid', number: 6, age: 22 },
    { name: 'William Saliba', position: 'CB', club: 'Arsenal', number: 17, age: 24 },
    { name: 'Théo Hernandez', position: 'LB', club: 'AC Milan', number: 22, age: 27 }
  ],
  'Senegal': [
    { name: 'Sadio Mané', position: 'LW/ST', club: 'Al Nassr', number: 10, age: 34 },
    { name: 'Kalidou Koulibaly', position: 'CB', club: 'Al Hilal', number: 3, age: 33 },
    { name: 'Ismaïla Sarr', position: 'RW', club: 'Crystal Palace', number: 18, age: 27 },
    { name: 'Idrissa Gueye', position: 'CDM/CM', club: 'Everton', number: 5, age: 35 },
    { name: 'Nicolas Jackson', position: 'ST', club: 'Chelsea', number: 19, age: 24 }
  ],
  'Iraq': [
    { name: 'Ali Al-Hamadi', position: 'ST', club: 'Ipswich Town', number: 9, age: 23 },
    { name: 'Aymen Hussein', position: 'ST', club: 'Al Quwa Al Jawiya', number: 18, age: 29 },
    { name: 'Ali Adnan', position: 'LB/LM', club: 'North East United', number: 3, age: 31 },
    { name: 'Ibrahim Bayesh', position: 'AM', club: 'Al Quwa Al Jawiya', number: 11, age: 25 }
  ],
  'Norway': [
    { name: 'Erling Haaland', position: 'ST', club: 'Manchester City', number: 9, age: 24 },
    { name: 'Martin Ødegaard', position: 'AM/CM', club: 'Arsenal', number: 10, age: 26 },
    { name: 'Alexander Sørloth', position: 'ST', club: 'Villarreal', number: 19, age: 29 },
    { name: 'Fredrik Aursnes', position: 'CM', club: 'Benfica', number: 8, age: 29 },
    { name: 'Andreas Hanche-Olsen', position: 'CB', club: 'Mainz', number: 4, age: 28 }
  ],

  // Group J
  'Argentina': [
    { name: 'Lionel Messi', position: 'RW/AM', club: 'Inter Miami', number: 10, age: 38 },
    { name: 'Julián Álvarez', position: 'ST', club: 'Atlético Madrid', number: 9, age: 25 },
    { name: 'Enzo Fernández', position: 'CM', club: 'Chelsea', number: 24, age: 24 },
    { name: 'Lautaro Martínez', position: 'ST', club: 'Inter Milan', number: 22, age: 27 },
    { name: 'Cristian Romero', position: 'CB', club: 'Tottenham', number: 13, age: 27 }
  ],
  'Algeria': [
    { name: 'Riyad Mahrez', position: 'RW', club: 'Al Ahli', number: 7, age: 34 },
    { name: 'Ismaël Bennacer', position: 'CM/CDM', club: 'AC Milan', number: 10, age: 27 },
    { name: 'Youcef Belaïli', position: 'LW/AM', club: 'MC Alger', number: 9, age: 33 },
    { name: 'Aïssa Mandi', position: 'CB', club: 'LOSC Lille', number: 2, age: 33 },
    { name: 'Adam Ounas', position: 'RW', club: 'LOSC Lille', number: 11, age: 28 }
  ],
  'Austria': [
    { name: 'David Alaba', position: 'CB/LB', club: 'Real Madrid', number: 4, age: 33 },
    { name: 'Marcel Sabitzer', position: 'CM/AM', club: 'Borussia Dortmund', number: 7, age: 31 },
    { name: 'Christoph Baumgartner', position: 'AM', club: 'RB Leipzig', number: 10, age: 25 },
    { name: 'Konrad Laimer', position: 'CDM/CM', club: 'Bayern Munich', number: 6, age: 28 },
    { name: 'Marko Arnautović', position: 'ST', club: 'Inter Milan', number: 9, age: 36 }
  ],
  'Jordan': [
    { name: 'Ali Olwan', position: 'LW', club: 'Al Ramtha', number: 9, age: 25 },
    { name: 'Musa Al-Taamari', position: 'RW', club: 'Montpellier', number: 10, age: 28 },
    { name: 'Yazan Al-Naimat', position: 'ST', club: 'Al Ahli', number: 11, age: 26 },
    { name: 'Ehsan Haddad', position: 'RB', club: 'Free Agent', number: 2, age: 31 }
  ],

  // Group K
  'Portugal': [
    { name: 'Cristiano Ronaldo', position: 'ST', club: 'Al Nassr', number: 7, age: 40 },
    { name: 'Bruno Fernandes', position: 'CM/AM', club: 'Manchester United', number: 8, age: 30 },
    { name: 'Bernardo Silva', position: 'RW/CM', club: 'Manchester City', number: 10, age: 30 },
    { name: 'Rúben Dias', position: 'CB', club: 'Manchester City', number: 4, age: 28 },
    { name: 'Rafael Leão', position: 'LW', club: 'AC Milan', number: 17, age: 26 }
  ],
  'Congo DR': [
    { name: 'Cédric Bakambu', position: 'ST', club: 'Real Betis', number: 9, age: 34 },
    { name: 'Yoane Wissa', position: 'LW/ST', club: 'Brentford', number: 14, age: 28 },
    { name: 'Gradel Yannick', position: 'LW', club: 'Bristol City', number: 12, age: 32 },
    { name: 'Chancel Mbemba', position: 'CB', club: 'Marseille', number: 4, age: 30 },
    { name: 'Samuel Moutoussamy', position: 'CM', club: 'Nantes', number: 8, age: 28 }
  ],
  'Uzbekistan': [
    { name: 'Eldor Shomurodov', position: 'ST', club: 'Roma', number: 14, age: 29 },
    { name: 'Oston Urunov', position: 'RW', club: 'Al Nassr', number: 10, age: 24 },
    { name: 'Odiljon Hamrobekov', position: 'CM', club: 'Pakhtakor', number: 7, age: 29 },
    { name: 'Jaloliddin Masharipov', position: 'LW', club: 'Al Nassr', number: 11, age: 31 },
    { name: 'Rustamjon Ashurmatov', position: 'CB', club: 'Rubin Kazan', number: 5, age: 28 }
  ],
  'Colombia': [
    { name: 'Luis Díaz', position: 'LW', club: 'Liverpool', number: 7, age: 28 },
    { name: 'James Rodríguez', position: 'AM', club: 'São Paulo', number: 10, age: 33 },
    { name: 'Rafael Santos Borré', position: 'ST', club: 'Internacional', number: 19, age: 29 },
    { name: 'Yerry Mina', position: 'CB', club: 'Fiorentina', number: 13, age: 30 },
    { name: 'Davinson Sánchez', position: 'CB', club: 'Galatasaray', number: 23, age: 29 }
  ],

  // Group L
  'England': [
    { name: 'Harry Kane', position: 'ST', club: 'Bayern Munich', number: 9, age: 31 },
    { name: 'Jude Bellingham', position: 'CM/AM', club: 'Real Madrid', number: 10, age: 22 },
    { name: 'Bukayo Saka', position: 'RW', club: 'Arsenal', number: 7, age: 23 },
    { name: 'Declan Rice', position: 'CDM/CM', club: 'Arsenal', number: 4, age: 26 },
    { name: 'Phil Foden', position: 'LW/AM', club: 'Manchester City', number: 11, age: 25 }
  ],
  'Croatia': [
    { name: 'Luka Modrić', position: 'CM', club: 'Real Madrid', number: 10, age: 39 },
    { name: 'Mateo Kovačić', position: 'CM', club: 'Manchester City', number: 8, age: 31 },
    { name: 'Joško Gvardiol', position: 'CB/LB', club: 'Manchester City', number: 6, age: 23 },
    { name: 'Andrej Kramarić', position: 'ST', club: 'Hoffenheim', number: 9, age: 33 },
    { name: 'Ivan Perišić', position: 'LW/LB', club: 'Hajduk Split', number: 4, age: 36 }
  ],
  'Ghana': [
    { name: 'Mohammed Kudus', position: 'AM/RW', club: 'West Ham', number: 10, age: 24 },
    { name: 'Thomas Partey', position: 'CDM/CM', club: 'Arsenal', number: 5, age: 32 },
    { name: 'Antoine Semenyo', position: 'LW/ST', club: 'Bournemouth', number: 9, age: 25 },
    { name: 'Iñaki Williams', position: 'ST', club: 'Athletic Bilbao', number: 11, age: 31 },
    { name: 'Alexander Djiku', position: 'CB', club: 'Fenerbahçe', number: 4, age: 30 }
  ],
  'Panama': [
    { name: 'Adalberto Carrasquilla', position: 'CM', club: 'Monterrey', number: 20, age: 26 },
    { name: 'Ismael Díaz', position: 'LW', club: 'Universidad Católica', number: 10, age: 28 },
    { name: 'Rolando Blackburn', position: 'ST', club: 'Comunicaciones', number: 9, age: 35 },
    { name: 'Aníbal Godoy', position: 'CDM', club: 'Free Agent', number: 6, age: 35 },
    { name: 'José Fajardo', position: 'ST', club: 'Cienciano', number: 11, age: 31 }
  ]
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLAYERS };
}
