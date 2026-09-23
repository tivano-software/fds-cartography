/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Writer;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.commons.lang3.ArrayUtils;
import org.checkerframework.checker.nullness.qual.Nullable;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.bean.HeaderColumnNameMappingStrategy;
import com.opencsv.bean.StatefulBeanToCsv;
import com.opencsv.bean.StatefulBeanToCsvBuilder;
import com.opencsv.exceptions.CsvException;
import com.opencsv.exceptions.CsvRequiredFieldEmptyException;

/**
 * Utility class for handling CSV data
 */
abstract class CSVUtils {
    /**
     * Parses a CSV file in the <code>src/resources/raw-data</code> directory.
     */
    static <T> Stream<T> readRawDataCSV(String csv, Class<T> type) {
        return readRawDataCSV(csv, type, ';');
    }

    /**
     * Parses a CSV file in the <code>src/resources/raw-data</code> directory with arbitrary field separator.
     */
    static <T> Stream<T> readRawDataCSV(String csv, Class<T> type, char sep) {
        return readCSV("raw-data/" + csv, type, sep);
    }

    /**
     * Parses a CSV file in the <code>src/resources</code> directory with arbitrary field separator.
     */
    static <T> Stream<T> readCSV(String csv, Class<T> type, char sep) {
        @Nullable InputStream data = CSVUtils.class.getResourceAsStream("/" + csv);
        if (data == null) {
            throw new IllegalArgumentException("resource '/" + csv + "' not found on classpath");
        }
        return new CsvToBeanBuilder<T>(new InputStreamReader(data))
                .withType(type)
                .withSeparator(sep)
                .build()
                .stream();
    }

    /**
     * Parses a CSV file in the <code>src/resources</code> directory with arbitrary field separator.
     * @throws FileNotFoundException
     * @throws IllegalStateException
     */
    static <T> CsvToBean<T> csvReaderForFilename(String filename, Class<T> type, char sep) throws IllegalStateException, FileNotFoundException {
        return new CsvToBeanBuilder<T>(new FileReader(filename))
                .withType(type)
                .withSeparator(sep)
                .build();
    }

    /**
     * Parses a CSV file in the <code>src/resources</code> directory with arbitrary field separator.
     * @throws FileNotFoundException
     * @throws IllegalStateException
     */
    static <T> CsvToBean<T> csvReaderForResource(String filename, Class<T> type, char sep) {
        @Nullable InputStream data = CSVUtils.class.getResourceAsStream("/" + filename);
        if (data == null) {
            throw new IllegalArgumentException("resource '/" + filename + "' not found on classpath");
        }
        return new CsvToBeanBuilder<T>(new InputStreamReader(data))
                .withType(type)
                .withSeparator(sep)
                .build();
    }

    private static class NoHeadersColumnNameMappingStrategy<T> extends HeaderColumnNameMappingStrategy<T> {
        @Override
        public String[] generateHeader(T bean) throws CsvRequiredFieldEmptyException {
            super.generateHeader(bean); // Call the super implementation for its side effects
            return ArrayUtils.EMPTY_STRING_ARRAY;
        }
    }

    /**
     * Writes unannotated beans to a CSV file.
     */
    static <T> void writeCSV(String csv, Class<T> type, Stream<? extends T> data, String... columnOrder)
            throws IOException, CsvException
    {
        try(Writer out = new FileWriter(csv)) {
            writeCSV(out, type, data, true, columnOrder);
        }
    }

    static <T> void writeCSV(Writer csv, Class<T> type, Stream<? extends T> data, boolean writeHeaders, String... columnOrder)
            throws IOException, CsvException
    {
        HeaderColumnNameMappingStrategy<T> mappingStrategy = writeHeaders
            ? new HeaderColumnNameMappingStrategy<T>()
            : new NoHeadersColumnNameMappingStrategy<T>();

        mappingStrategy.setType(type);
        List<String> order = Arrays.asList(columnOrder).stream()
                .map(String::toUpperCase)
                .collect(Collectors.toList());
        mappingStrategy.setColumnOrderOnWrite((String s1, String s2) -> {
            if (Objects.equals(s1, s2))
                return 0;
            int i1 = order.indexOf(s1);
            int i2 = order.indexOf(s2);
            if (i1 >= 0) {
                return (i2 >= 0 ? i1 - i2 : -1);
            } else {
                return (i2 >= 0 ? 1 : s1.compareTo(s2));
            }
        });
        StatefulBeanToCsv<T> bean2csv = new StatefulBeanToCsvBuilder<T>(csv)
                .withQuotechar('"')
                .withSeparator(',')
                .withApplyQuotesToAll(false)
                .withMappingStrategy(mappingStrategy)
                .build();
        bean2csv.write(data.map(entry -> (T)entry));
    }
}
