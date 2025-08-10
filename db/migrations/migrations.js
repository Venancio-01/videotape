// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from "./0000_cultured_lizard.sql";
import m0001 from "./0001_awesome_clint_barton.sql";
import m0002 from "./0002_video_schema.sql";
import m0003 from "./0003_flippant_justice.sql";
import m0004 from "./0004_enhanced_database_schema.sql";
import journal from "./meta/_journal.json";

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
  },
};
