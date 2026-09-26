/** Marcador azul de “mi ubicación” para los mapas embebidos. */
export function myLocationDotJs() {
  return `
    var meMarker = null;
    var meCircle = null;
    function paintMyLocation(me) {
      if (!map) return null;
      if (!me || !isFinite(Number(me.lat)) || !isFinite(Number(me.lng))) {
        if (meMarker) { meMarker.setMap(null); meMarker = null; }
        if (meCircle) { meCircle.setMap(null); meCircle = null; }
        return null;
      }
      var pos = { lat: Number(me.lat), lng: Number(me.lng) };
      var radius = Math.max(20, Number(me.accuracy) || 40);
      if (!meMarker) {
        meMarker = new google.maps.Marker({
          map: map,
          position: pos,
          clickable: false,
          zIndex: 90,
          title: 'Mi ubicación',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#1A73E8',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
          }
        });
      } else {
        meMarker.setPosition(pos);
      }
      if (!meCircle) {
        meCircle = new google.maps.Circle({
          map: map,
          center: pos,
          radius: radius,
          strokeColor: '#1A73E8',
          strokeOpacity: 0.28,
          strokeWeight: 1,
          fillColor: '#1A73E8',
          fillOpacity: 0.12,
          clickable: false,
          zIndex: 2
        });
      } else {
        meCircle.setCenter(pos);
        meCircle.setRadius(radius);
      }
      return pos;
    }
  `;
}
