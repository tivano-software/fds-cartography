/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.webapp;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;

import com.opencsv.CSVWriter;
import com.opencsv.CSVWriterBuilder;
import com.opencsv.ICSVWriter;

public class CSVUtils {
    public static ICSVWriter createWriter(OutputStream out, Codec codec) throws IOException {
        final ICSVWriter writer = new CSVWriterBuilder(new OutputStreamWriter(out))
            .withSeparator(';')
            .withQuoteChar(CSVWriter.DEFAULT_QUOTE_CHARACTER)
            .withEscapeChar(CSVWriter.DEFAULT_ESCAPE_CHARACTER)
            .withLineEnd(CSVWriter.DEFAULT_LINE_END)
            .build();
        switch (codec) {
            case UTF8:
                out.write(0xef);
                out.write(0xbb);
                out.write(0xbf);
                break;
        }
        return writer;
    }

    public static enum Codec {
        UTF8
    }
}
