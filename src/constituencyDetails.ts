export interface ConstituencyDetail {
  id: string;
  name: string;
  district: string;
  candidates2026: {
    ldf: { name: string; party: string };
    udf: { name: string; party: string };
    nda: { name: string; party: string };
    others: string[];
  };
  results2021: {
    winner: { name: string; front: string; votes: string };
    runnerUp: { name: string; votes: string };
    margin: string;
    electors: string;
    turnout: string;
    nota: string;
  };
  population: string;
  demographics: {
    male: string;
    female: string;
    others: string;
  };
  url: string;
}

export const CONSTITUENCY_DETAILS: Record<string, ConstituencyDetail> = {
  "1": {
    id: "1",
    name: "MANJESHWAR",
    district: "Kasaragod",
    candidates2026: {
      ldf: { name: "K. R. Jayanandan", party: "CPI(M)" },
      udf: { name: "A. K. M. Ashraf", party: "IUML" },
      nda: { name: "K. Surendran", party: "BJP" },
      others: []
    },
    results2021: {
      winner: { name: "A K M ASHRAF", front: "UDF", votes: "65,758" },
      runnerUp: { name: "K SURENDRAN", votes: "65,013" },
      margin: "745",
      electors: "2,21,711",
      turnout: "77.93",
      nota: "387"
    },
    population: "2,85,000",
    demographics: { male: "1,40,000", female: "1,44,995", others: "5" },
    url: "https://kerala26.com/constituency/1"
  },
  "2": {
    id: "2",
    name: "KASARAGOD",
    district: "Kasaragod",
    candidates2026: {
      ldf: { name: "Shanavas Padhoor", party: "Independent (INL Support)" },
      udf: { name: "Kallatra Mahin Haji", party: "IUML" },
      nda: { name: "Ashwini M.L.", party: "BJP" },
      others: ["C.A. Savad (SDPI)"]
    },
    results2021: {
      winner: { name: "N A NELLIKKUNNU", front: "UDF", votes: "63,296" },
      runnerUp: { name: "ADV K SHREEKANTH", votes: "50,395" },
      margin: "12,901",
      electors: "2,01,863",
      turnout: "72.05",
      nota: "639"
    },
    population: "2,60,000",
    demographics: { male: "1,28,000", female: "1,31,990", others: "10" },
    url: "https://kerala26.com/constituency/2"
  },
  "3": {
    id: "3",
    name: "UDMA",
    district: "Kasaragod",
    candidates2026: {
      ldf: { name: "C. H. Kunhambu", party: "CPI(M)" },
      udf: { name: "Neelakantan", party: "INC" },
      nda: { name: "Manulal Meloth", party: "BJP" },
      others: []
    },
    results2021: {
      winner: { name: "C H KUNHAMBU", front: "LDF", votes: "78,664" },
      runnerUp: { name: "BALAKRISHNAN PERIYE", votes: "65,342" },
      margin: "13,322",
      electors: "2,14,368",
      turnout: "77.37",
      nota: "434"
    },
    population: "2,75,000",
    demographics: { male: "1,35,000", female: "1,39,992", others: "8" },
    url: "https://kerala26.com/constituency/3"
  },
  "4": {
    id: "4",
    name: "KANHANGAD",
    district: "Kasaragod",
    candidates2026: {
      ldf: { name: "Govindan Pallikkappil", party: "CPI" },
      udf: { name: "Shyji Ottapalli", party: "KEC" },
      nda: { name: "M. Balraj", party: "BJP" },
      others: []
    },
    results2021: {
      winner: { name: "E CHANDRASHEKARAN", front: "LDF", votes: "84,615" },
      runnerUp: { name: "P V SURESH", votes: "57,476" },
      margin: "27,139",
      electors: "2,18,836",
      turnout: "76.44",
      nota: "637"
    },
    population: "2,80,000",
    demographics: { male: "1,38,000", female: "1,41,988", others: "12" },
    url: "https://kerala26.com/constituency/4"
  },
  "5": {
    id: "5",
    name: "TRIKARIPUR",
    district: "Kasaragod",
    candidates2026: {
      ldf: { name: "V. P. P. Mustafa", party: "CPI(M)" },
      udf: { name: "Sandeep Varier", party: "INC" },
      nda: { name: "N/A", party: "N/A" },
      others: ["Ravi Kulangara (TTP)"]
    },
    results2021: {
      winner: { name: "M RAJAGOPALAN", front: "LDF", votes: "86,151" },
      runnerUp: { name: "M P JOSEPH", votes: "60,014" },
      margin: "26,137",
      electors: "2,03,189",
      turnout: "79.04",
      nota: "558"
    },
    population: "2,65,000",
    demographics: { male: "1,30,000", female: "1,34,994", others: "6" },
    url: "https://kerala26.com/constituency/5"
  },
  "6": {
    id: "6",
    name: "PAYYANNUR",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "T. I. Madhusoodanan", party: "CPI(M)" },
      udf: { name: "V. Kunjikrishnan", party: "Independent (RSP support)" },
      nda: { name: "A. P. Gangadharan", party: "BJP" },
      others: []
    },
    results2021: {
      winner: { name: "T I MADHUSOODANAN", front: "LDF", votes: "93,695" },
      runnerUp: { name: "M PRADEEP KUMAR", votes: "43,915" },
      margin: "49,780",
      electors: "1,84,264",
      turnout: "81.87",
      nota: "686"
    },
    population: "2,40,000",
    demographics: { male: "1,15,000", female: "1,24,997", others: "3" },
    url: "https://kerala26.com/constituency/6"
  },
  "7": {
    id: "7",
    name: "KALLIASSERI",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "M. Vijin", party: "CPI(M)" },
      udf: { name: "Rajeevan Kappacheri", party: "INC" },
      nda: { name: "A.V. Sanil Kumar", party: "BJP" },
      others: ["K.K. Abdul Jabbar (SDPI)"]
    },
    results2021: {
      winner: { name: "M VIJIN", front: "LDF", votes: "88,252" },
      runnerUp: { name: "ADV. BRIJESH KUMAR", votes: "43,859" },
      margin: "44,393",
      electors: "1,85,592",
      turnout: "78.86",
      nota: "666"
    },
    population: "2,45,000",
    demographics: { male: "1,18,000", female: "1,26,991", others: "9" },
    url: "https://kerala26.com/constituency/7"
  },
  "8": {
    id: "8",
    name: "TALIPARAMBA",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "P. K. Shyamala", party: "CPI(M)" },
      udf: { name: "T. K. Govindan", party: "Independent (INC Support)" },
      nda: { name: "N. Haridas", party: "BJP" },
      others: ["Anappally Gopalan (AAP)"]
    },
    results2021: {
      winner: { name: "M V GOVINDAN MASTER", front: "LDF", votes: "92,870" },
      runnerUp: { name: "ADV. V P ABDUL RASHEED", votes: "70,181" },
      margin: "22,689",
      electors: "2,14,068",
      turnout: "83.44",
      nota: "789"
    },
    population: "2,80,000",
    demographics: { male: "1,35,000", female: "1,44,993", others: "7" },
    url: "https://kerala26.com/constituency/8"
  },
  "9": {
    id: "9",
    name: "IRIKKUR",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "Mathew Kunnappally", party: "Kerala Congress (M)" },
      udf: { name: "Sajeev Joseph", party: "INC" },
      nda: { name: "N/A", party: "N/A" },
      others: ["Sreenath Padmanabhan (TTP)", "Joseph P.V (AAP)", "M. J. Mathew (SDPI)"]
    },
    results2021: {
      winner: { name: "Adv. Sajeev Joseph", front: "UDF", votes: "76,764" },
      runnerUp: { name: "SAJI KUTTIYANIMATTAM", votes: "66,754" },
      margin: "10,010",
      electors: "1,95,695",
      turnout: "78.2",
      nota: "459"
    },
    population: "2,55,000",
    demographics: { male: "1,25,000", female: "1,29,996", others: "4" },
    url: "https://kerala26.com/constituency/9"
  },
  "10": {
    id: "10",
    name: "AZHIKODE",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "K. V. Sumesh", party: "CPI(M)" },
      udf: { name: "Kareem Cheleri", party: "IUML" },
      nda: { name: "K. K. Vinod Kumar", party: "BJP" },
      others: []
    },
    results2021: {
      winner: { name: "K V Sumesh", front: "LDF", votes: "65,794" },
      runnerUp: { name: "K M Shaji", votes: "59,653" },
      margin: "6,141",
      electors: "1,81,838",
      turnout: "79.85",
      nota: "517"
    },
    population: "2,35,000",
    demographics: { male: "1,12,000", female: "1,22,992", others: "8" },
    url: "https://kerala26.com/constituency/10"
  },
  "11": {
    id: "11",
    name: "KANNUR",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "Kadannappalli Ramachandran", party: "Congress (Secular)" },
      udf: { name: "Adv. T. O. Mohanan", party: "INC" },
      nda: { name: "C. Raghunath", party: "BJP" },
      others: []
    },
    results2021: {
      winner: { name: "RAMACHANDRAN KADANNAPPALLI", front: "LDF", votes: "60,313" },
      runnerUp: { name: "SATHEESHAN PACHENI", votes: "58,568" },
      margin: "1,745",
      electors: "1,74,370",
      turnout: "77.29",
      nota: "504"
    },
    population: "2,25,000",
    demographics: { male: "1,08,000", female: "1,16,995", others: "5" },
    url: "https://kerala26.com/constituency/11"
  },
  "12": {
    id: "12",
    name: "DHARMADAM",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "Pinarayi Vijayan", party: "CPI(M)" },
      udf: { name: "Abdul Rasheed", party: "INC" },
      nda: { name: "K. Ranjith", party: "BJP" },
      others: []
    },
    results2021: {
      winner: { name: "Pinarayi Vijayan", front: "LDF", votes: "95,522" },
      runnerUp: { name: "C. Raghunathan", votes: "45,399" },
      margin: "50,123",
      electors: "1,94,462",
      turnout: "82.91",
      nota: "400"
    },
    population: "2,50,000",
    demographics: { male: "1,20,000", female: "1,29,990", others: "10" },
    url: "https://kerala26.com/constituency/12"
  },
  "13": {
    id: "13",
    name: "THALASSERY",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "Karayi Rajan", party: "CPI(M)" },
      udf: { name: "K. P. Saju", party: "INC" },
      nda: { name: "O. Nidheesh", party: "BJP" },
      others: ["A.C. Jalaluddin (SDPI)"]
    },
    results2021: {
      winner: { name: "Adv. A. N. SHAMSEER", front: "LDF", votes: "81,810" },
      runnerUp: { name: "M. P. ARAVINDAKSHAN", votes: "45,009" },
      margin: "36,801",
      electors: "1,75,437",
      turnout: "76.13",
      nota: "2,313"
    },
    population: "2,30,000",
    demographics: { male: "1,10,000", female: "1,19,992", others: "8" },
    url: "https://kerala26.com/constituency/13"
  },
  "14": {
    id: "14",
    name: "KUTHUPARAMBA",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "P. K. Praveen", party: "RJD" },
      udf: { name: "Jayanthi Rajan", party: "IUML" },
      nda: { name: "Adv. Shijilal", party: "BJP" },
      others: ["Rafeed AP (AAP)"]
    },
    results2021: {
      winner: { name: "K.P. MOHANAN", front: "LDF", votes: "70,626" },
      runnerUp: { name: "POTTANKANDI ABDULLA", votes: "61,085" },
      margin: "9,541",
      electors: "1,94,344",
      turnout: "80.36",
      nota: "494"
    },
    population: "2,55,000",
    demographics: { male: "1,22,000", female: "1,32,988", others: "12" },
    url: "https://kerala26.com/constituency/14"
  },
  "15": {
    id: "15",
    name: "MATTANNUR",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "V. K. Sanoj", party: "CPI(M)" },
      udf: { name: "Chandran Thillankeri", party: "INC" },
      nda: { name: "Biju Elakkuzhi", party: "BJP" },
      others: ["Basheer Punnad (SDPI)"]
    },
    results2021: {
      winner: { name: "K K SHAILAJA TEACHER", front: "LDF", votes: "96,129" },
      runnerUp: { name: "ILLIKKAL AUGUSTHY", votes: "35,166" },
      margin: "60,963",
      electors: "1,90,139",
      turnout: "82.01",
      nota: "796"
    },
    population: "2,45,000",
    demographics: { male: "1,18,000", female: "1,26,994", others: "6" },
    url: "https://kerala26.com/constituency/15"
  },
  "16": {
    id: "16",
    name: "PERAVOOR",
    district: "Kannur",
    candidates2026: {
      ldf: { name: "K. K. Shailaja", party: "CPI(M)" },
      udf: { name: "Sunny Joseph", party: "INC" },
      nda: { name: "Paily Vathiatt", party: "BDJS" },
      others: ["Adv. Henstion George (AAP)"]
    },
    results2021: {
      winner: { name: "Adv. Sunny Joseph", front: "UDF", votes: "66,706" },
      runnerUp: { name: "K V Sakkeer Hussain", votes: "63,534" },
      margin: "3,172",
      electors: "1,77,818",
      turnout: "80.63",
      nota: "404"
    },
    population: "2,30,000",
    demographics: { male: "1,10,000", female: "1,19,997", others: "3" },
    url: "https://kerala26.com/constituency/16"
  },
  "17": {
    id: "17",
    name: "MANANTHAVADY (ST)",
    district: "Wayanad",
    candidates2026: {
      ldf: { name: "O. R. Kelu", party: "CPI(M)" },
      udf: { name: "Usha Vijayan", party: "INC" },
      nda: { name: "P. Shyam Raj", party: "BJP" },
      others: ["Vishnu P.G (AAP)"]
    },
    results2021: {
      winner: { name: "O.R.KELU", front: "LDF", votes: "72,536" },
      runnerUp: { name: "P.K.Jayalakshmi", votes: "63,254" },
      margin: "9,282",
      electors: "1,95,326",
      turnout: "78.33",
      nota: "797"
    },
    population: "2,50,000",
    demographics: { male: "1,22,000", female: "1,27,991", others: "9" },
    url: "https://kerala26.com/constituency/17"
  },
  "18": {
    id: "18",
    name: "SULTHANBATHERY (ST)",
    district: "Wayanad",
    candidates2026: {
      ldf: { name: "M. S. Viswanathan", party: "CPI(M)" },
      udf: { name: "I. C. Balakrishnan", party: "INC" },
      nda: { name: "A. S. Kavitha", party: "BJP" },
      others: ["Prakrithi N V (AAP)"]
    },
    results2021: {
      winner: { name: "I.C BALAKRISHNAN", front: "UDF", votes: "81,077" },
      runnerUp: { name: "M.S VISWANATHAN", votes: "69,255" },
      margin: "11,822",
      electors: "2,20,642",
      turnout: "75.99",
      nota: "1,160"
    },
    population: "2,85,000",
    demographics: { male: "1,40,000", female: "1,44,993", others: "7" },
    url: "https://kerala26.com/constituency/18"
  },
  "19": {
    id: "19",
    name: "KALPETTA",
    district: "Wayanad",
    candidates2026: {
      ldf: { name: "P. K. Anil Kumar", party: "RJD" },
      udf: { name: "T. Siddique", party: "INC" },
      nda: { name: "Prasanth Malavayal", party: "BJP" },
      others: ["Rafeek C A (AAP)"]
    },
    results2021: {
      winner: { name: "Adv.T SIDDIQU", front: "UDF", votes: "70,252" },
      runnerUp: { name: "M.V.SHREYAMSKUMAR", votes: "64,782" },
      margin: "5,470",
      electors: "2,01,192",
      turnout: "75.84",
      nota: "828"
    },
    population: "2,60,000",
    demographics: { male: "1,28,000", female: "1,31,996", others: "4" },
    url: "https://kerala26.com/constituency/19"
  },
  "20": {
    id: "20",
    name: "VADAKARA",
    district: "Kozhikode",
    candidates2026: {
      ldf: { name: "M. K. Bhaskaran", party: "RJD" },
      udf: { name: "K. K. Rema", party: "RMPI" },
      nda: { name: "K. Dileep", party: "BJP" },
      others: []
    },
    results2021: {
      winner: { name: "K.K.REMA", front: "UDF", votes: "65,093" },
      runnerUp: { name: "MANAYATH CHANDRAN", votes: "57,602" },
      margin: "7,491",
      electors: "1,67,694",
      turnout: "81.9",
      nota: "353"
    },
    population: "2,15,000",
    demographics: { male: "1,05,000", female: "1,09,992", others: "8" },
    url: "https://kerala26.com/constituency/20"
  }
};
