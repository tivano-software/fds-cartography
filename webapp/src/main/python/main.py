import json
from filter import filter

def main(path_in, filenmae, path_out):
    f_in = open(path_in + filenmae)
    data = json.load(f_in)
    data_reduced = filter(data)
    f_out = open(path_out + filenmae, 'w')
    json.dump(data_reduced, f_out)


main('data/', 'geojson-borders.json', '../webapp/data/')
main('data/', 'geojson-water-lin.json', '../webapp/data/')
main('data/', 'geojson-water-poly.json', '../webapp/data/')