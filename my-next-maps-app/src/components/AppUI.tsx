 'use client';

import React, { useEffect, useRef, useState } from "react";
import {
  Box, Button, ButtonGroup, Flex, Stack,
  IconButton, Input, SkeletonText, Text, Collapse
} from "@chakra-ui/react";
import { FaLocationArrow, FaTimes } from "react-icons/fa";
import {
  useJsApiLoader, GoogleMap, Marker,
  Autocomplete, DirectionsRenderer
} from "@react-google-maps/api";

const center = { lat: 25.605028755206394, lng: 85.07451919725354 };

export default function AppUI() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"]
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [originMarker, setOriginMarker] = useState<google.maps.LatLngLiteral | null>(null);

  const originRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    function handleResize() {
      setIsCollapsed(window.innerWidth < 733 && window.innerHeight < 617);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isLoaded) return <SkeletonText />;

  async function calculateRoute() {
    if (!originRef.current?.value || !destRef.current?.value) return;
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destRef.current.value,
      travelMode: google.maps.TravelMode.DRIVING
    });
    setDirectionsResponse(results);
    const leg = results.routes[0].legs[0];
    setDistance(leg.distance?.text || "");
    setDuration(leg.duration?.text || "");
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
    if (originRef.current) originRef.current.value = "";
    if (destRef.current) destRef.current.value = "";
  }

  function getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const latlng = { lat: latitude, lng: longitude };
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            if (originRef.current) originRef.current.value = results[0].formatted_address;
            map?.panTo(latlng);
            map?.setZoom(8);
            setTimeout(() => map?.setZoom(15), 300);
            setOriginMarker(latlng);
          } else {
            alert("No address found.");
          }
        });
      });
    } else {
      alert("Geolocation not supported.");
    }
  }

  return (
    <Flex position="relative" flexDirection="column" alignItems="center" h="100vh" w="100vw">
      <Box position="absolute" left={0} top={0} h="100%" w="100%">
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={{
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: false,
            fullscreenControl: true
          }}
          onLoad={mapInstance => setMap(mapInstance)}
        >
          <Marker position={center} />
          {originMarker && <Marker position={originMarker} label="A" />}
          {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
        </GoogleMap>
      </Box>

      <Box p={{ base: 2, md: 4 }} borderRadius="lg" m={4} bg="white" shadow="base" w={{ base: "90vw", md: "container.md" }} zIndex={1}>
        <Collapse in={!isCollapsed} animateOpacity>
          <Stack spacing={2} direction={{ base: "column", md: "row" }} justifyContent="space-between">
            <Box flexGrow={1}>
              <Autocomplete>
                <Input type="text" placeholder="Origin" ref={originRef} size="xs" />
              </Autocomplete>
            </Box>
            <Box flexGrow={1}>
              <Autocomplete>
                <Input type="text" placeholder="Destination" ref={destRef} size="xs" />
              </Autocomplete>
            </Box>
            <ButtonGroup flexWrap="wrap" justifyContent={{ base: "center", md: "flex-start" }}>
              <Button colorScheme="pink" onClick={calculateRoute} size="xs">Start</Button>
              <IconButton aria-label="Clear" icon={<FaTimes />} onClick={clearRoute} size="xs" />
              <Button onClick={getCurrentLocation} colorScheme="blue" size="xs">Use My Location</Button>
            </ButtonGroup>
          </Stack>
          <Button size="sm" mt={2} onClick={() => setIsCollapsed(true)} colorScheme="gray" w="100%">Collapse Route Inputs</Button>
        </Collapse>

        {isCollapsed && (
          <Button size="sm" mt={2} onClick={() => setIsCollapsed(false)} colorScheme="teal" w="100%">Expand Route Inputs</Button>
        )}

        <Stack spacing={2} direction={{ base: "column", md: "row" }} justifyContent="space-between" alignItems={{ base: "flex-start", md: "center" }} mt={4}>
          <Text fontSize="sm">Distance: {distance}</Text>
          <Text fontSize="sm">Duration: {duration}</Text>
          <IconButton
            aria-label="Recenter"
            icon={<FaLocationArrow />}
            isRound
            onClick={() => {
              map?.panTo(center);
              map?.setZoom(15);
            }}
            size="sm"
          />
        </Stack>
      </Box>
    </Flex>
  );
}