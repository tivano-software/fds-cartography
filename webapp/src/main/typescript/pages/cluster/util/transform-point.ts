

function tranformPoint(element: { getScreenCTM(): DOMMatrix | null }, p: [number, number]): [number, number] {
    const svg: SVGSVGElement = document.getElementById('clusterSvg') as unknown as SVGSVGElement;
    const point = svg.createSVGPoint();
    point.x = p[0];
    point.y = p[1];
    const result = point.matrixTransform( element.getScreenCTM()!.inverse() );
    return [result.x, result.y];
  }