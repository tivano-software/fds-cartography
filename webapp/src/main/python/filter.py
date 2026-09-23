

def filter(data):
    features = data['features']
    data['features'] = filter_features(features)
    return data

def filter_features(features):
    features_new = []
    for feature in features:
        feature_new = filter_feature(feature)
        if not feature_new is None:
            features_new.append(feature_new)
    return features_new

def filter_feature(feature):
    coordinates_list = feature['geometry']['coordinates']
    coordinates_list_new = filter_coordinates_list(coordinates_list)
    if coordinates_list_new == []:
        return None
    feature['geometry']['coordinates'] = coordinates_list_new
    return feature

def filter_coordinates_list(coordinates_list):
    if len(coordinates_list) == 0:
        return None
    if len(coordinates_list) == 2:
        [x, y] = coordinates_list
        if type(x) == float and type(y) == float:
            is_inside = predicate_take_point([x,y])
            if is_inside:
                return [x, y]
            else:
                return None

    coordinates_list_new = []
    for coordinates_list_inner in coordinates_list:
        coordinates_list_inner_new = filter_coordinates_list(coordinates_list_inner)
        if not coordinates_list_inner_new == [] and not coordinates_list_inner_new is None:
            coordinates_list_new.append(coordinates_list_inner_new)
    return coordinates_list_new

def predicate_take_point(point):
    upper_left_x = 5.8
    upper_left_y = 45.68086393
    lower_right_x = 10.559517347
    lower_right_y = 47.85

    [x, y] = point
    if x < upper_left_x or y < upper_left_y:
        return False
    if x > lower_right_x or y > lower_right_y:
        return False
    print(point)
    return True

