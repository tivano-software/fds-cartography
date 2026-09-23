/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.io.IOException;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.checkerframework.checker.nullness.qual.Nullable;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.exceptions.CsvException;

import ch.unibe.germanistik.namenatlas.LanguageCategory;
import ch.unibe.germanistik.namenatlas.NamingMotive;

/**
 * <h2>Import additional etymological data for {@link EtymologicalData} from the "Etymologische Datenbank".</h2>
 *
 * <p>
 * {@link EtymologicalData#main(java.lang.String[])} writes the converted data to
 * a CSV file.
 * </p>
 */

public class EtymologicalData {
    final Map<String, TypeDescriptionRaw> typesByName;

    private EtymologicalData(Map<String, TypeDescriptionRaw> typesByName) {
        this.typesByName = typesByName;
    }

    public static EtymologicalData readFromRawData() {
        Set<Integer> ignored = CSVUtils.csvReaderForResource("raw-data/etdb.ignore.csv", IgnoredEntries.class, ',')
            .stream().map(entry -> entry.ed_id).collect(Collectors.toSet());
        TreeMap<Integer, TypeDescriptionRaw> typesByID = new TreeMap<>();
        CSVUtils.csvReaderForResource("raw-data/etdb/e_edition.csv", TypeDescriptionRaw.class, '\t')
        .forEach(entry -> {
            if (!ignored.contains(entry.ed_id)) {
                typesByID.put(entry.ed_id, entry);
            }
        });
        CSVUtils.csvReaderForResource("raw-data/etdb/ed_spr.csv", LanguageMarker.class, '\t')
        .forEach(entry -> {
            @Nullable TypeDescriptionRaw type = typesByID.get(entry.ed_spr__ed_id);
            if (type != null) {
                type.addLanguageCategory(entry.ed_spr_spr);
            } else {
                throw new IllegalArgumentException("No TypeDescription found for ID " + entry.ed_spr__ed_id);
            }
        });
        Map<String, TypeDescriptionRaw> typesByName = new LinkedHashMap<>();
        typesByID.values().stream().forEach(entry -> {
            typesByName.put(entry.getName(), entry);
        });
        return new EtymologicalData(typesByName);
    }

    public @Nullable TypeDescriptionRaw get(String name) {
        return typesByName.get(name);
    }

    public static class LanguageMarker {
        @CsvBindByName public int ed_spr__ed_id = 0;
        @CsvBindByName public int ed_spr_spr = 0;
    }
    public static class IgnoredEntries {
        @CsvBindByName public int ed_id = 0;
        @CsvBindByName public String ed_lemma = "";
    }

    public static class TypeDescriptionRaw {
        @CsvBindByName public int ed_id = 0;
        @CsvBindByName public String ed_lemma = "";
        @CsvBindByName public int ed_namentyp = 0;
        @CsvBindByName public @Nullable String ed_etymologie = null;
        public final Set<LanguageCategory> languageCategories = EnumSet.noneOf(LanguageCategory.class);

        public String getName() { return ed_lemma; }
        public @Nullable String getDescription() { return ed_etymologie; }
        public Set<LanguageCategory> getLanguageCategories() { return languageCategories; }
        public Set<NamingMotive> getNamingMotives() {
            switch (ed_namentyp) {
                case 0: return EnumSet.noneOf(NamingMotive.class);
                case 1: return EnumSet.of(NamingMotive.ORIGIN_NAME);
                case 2: return EnumSet.of(NamingMotive.RESIDENCE_NAME);
                case 3: return EnumSet.of(NamingMotive.OCCUPATION_NAME);
                case 4: return EnumSet.of(NamingMotive.OCCUPATION_SOBRIQUET);
                case 5: return EnumSet.of(NamingMotive.SOBRIQUET);
                case 6: return EnumSet.of(NamingMotive.PATRONYM);
                case 7: return EnumSet.of(NamingMotive.METRONYM);
                case 8: return EnumSet.of(NamingMotive.OTHER_OR_MIXED);
                case 99: return EnumSet.of(NamingMotive.PROBLEMATIC_NAME);
                default:
                    throw new IllegalStateException("Unknown naming motive ID: " + ed_etymologie);
            }
        }

        void addLanguageCategory(int languageID) {
            LanguageCategory cat;
            switch (languageID) {
                case 1: cat = LanguageCategory.GEM_DEU; break;
                case 2: cat = LanguageCategory.ROH; break;
                case 3: cat = LanguageCategory.ITA; break;
                case 4: cat = LanguageCategory.FRA; break;
                case 5: cat = LanguageCategory.GRC_LAT; break;
                case 6: cat = LanguageCategory.UNKNOWN; break;
                case 7: cat = LanguageCategory.OTHER; break;
                // ID 8 is "hybrid" in ETDB, this is redundant and simply modelled as multiple entries
                // in the language category set
                case 8: return;
                default:
                    throw new IllegalStateException("Unknown language ID: " + languageID);
            }
            languageCategories.add(cat);
        }
    }

    public static class TypeDescription {
        @CsvBindByName public final String name;
        @CsvBindByName public final String languageCategories;
        @CsvBindByName public final String namingMotives;
        @CsvBindByName public final @Nullable String description;

        public TypeDescription(TypeDescriptionRaw other) {
            this.name = other.getName();
            this.languageCategories = asPostgresArrayLiteral(other.getLanguageCategories());
            this.namingMotives = asPostgresArrayLiteral(other.getNamingMotives());
            this.description = other.getDescription();
        }

        private static String asPostgresArrayLiteral(Set<? extends Enum<?>> value) {
            return "{" + value.stream().map(val -> val.name()).collect(Collectors.joining(", ")) +"}";
        }
    }

    /**
     * Generates a CSV file with final data.
     *
     * @param argv the path to the generated CSV file is expected in
     *             <code>argv[0]</code>. Any additional parameters are ignored.
     */
    public static void main(String[] argv) throws IOException, CsvException {
        EtymologicalData data = EtymologicalData.readFromRawData();
        CSVUtils.writeCSV(argv[0], TypeDescription.class, data.typesByName.values().stream().map(entry -> new TypeDescription(entry)),
            "NAME", "LANGUAGECATEGORIES", "NAMINGMOTIVES", "DESCRIPTION"
        );
    }

}
