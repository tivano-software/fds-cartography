import { StylesInterface } from "./styles.inerface";

export const Styles: StylesInterface = {
    map: {
        legend: {
            borderColor: "#339966",
            borderSize: 0.5,
        },
        piecharts: {
            rows: [
                /*
                [ '#4362d7', '#4bb210', '#ed561b', '#ffcc33', '#cc3366' ],
                [ '#00afab', '#ff828a', '#c129b9', '#001e61', '#e1e000' ],

                [ '#7e5d75', '#423ca7', '#ad9864', '#326880', '#6e778a' ],
                [ '#df8e36', '#5c71b3', '#3e3337', '#477f5d', '#b5ac2b' ],
                [ '#face65', '#343751', '#7f7f28', '#547191', '#bc3c45' ],
                [ '#c16544', '#963e59', '#c99757', '#3c4373', '#96b19e' ],
                [ '#a6427b', '#7d8fa7', '#cea3b8', '#c0d16a', '#4e87c1' ]
                */
                [ '#f1b6d3', '#fbeb25', '#9bd690', '#c0d9fc', '#5a83da' ],
                [ '#c173a5', '#f4932a', '#77b52b', '#6fc3cd', '#c129b9' ],
                [ '#903255', '#d53525', '#39733d', '#208d98', '#ffcc33' ],
                [ '#46021b', '#5a0a02', '#012d07', '#005058', '#000457' ],

            ],
            palette: [
                '#208d98',
                '#ffcc33',
                '#000457',
                '#d53525',
                '#f4932a',

                '#c0d9fc',
                '#c173a5',
                '#39733d',
                '#903255',
                '#5a83da',

                '#9bd690',
                '#6fc3cd',
                '#f1b6d3',
                '#77b52b',
                '#005058',
            ]
        },
        border: {
            'color': '#99cc99',
            'stroke-width': 0.005,
        },
        'canton-data': {
            'color': '#909090',
            'stroke-width': 0.002,
            'font-size': 5
        },
        water: {
            'color': '#99ccff',
            'stroke-width': (factor: number = 1) => factor * 0.02,
        }
    }
}