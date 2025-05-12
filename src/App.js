/* global google */
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Stack,
  IconButton,
  Input,
  SkeletonText,
  Text,
  Collapse,
} from "@chakra-ui/react";
import { FaLocationArrow, FaTimes } from "react-icons/fa";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";

const center = { lat: 25.605028755206394, lng: 85.07451919725354 };

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originMarker, setOriginMarker] = useState(null);

  const originRef = useRef();
  const destiantionRef = useRef();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsCollapsed(width < 733 && height < 617);
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isLoaded) return <SkeletonText />;

  async function calculateRoute() {
    if (originRef.current.value === "" || destiantionRef.current.value === "") {
      return;
    }
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destiantionRef.current.value,
      travelMode: google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance.text);
    setDuration(results.routes[0].legs[0].duration.text);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
    originRef.current.value = "";
    destiantionRef.current.value = "";
  }

  function getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const latlng = { lat: latitude, lng: longitude };

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK") {
            if (results[0]) {
              originRef.current.value = results[0].formatted_address;
              // Smooth pan + zoom trick
              map.panTo(latlng);
              map.setZoom(8); // zoom out first
              setTimeout(() => {
                map.setZoom(15); // zoom in after a short delay
              }, 300);
              setOriginMarker(latlng); // <-- Set marker position
            } else {
              alert("No address found for this location.");
            }
          } else {
            alert("Geocoder failed due to: " + status);
          }
        });
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  return (
    <Flex
      position="relative"
      flexDirection="column"
      alignItems="center"
      h="100vh"
      w="100vw"
    >
      <Box position="absolute" left={0} top={0} h="100%" w="100%">
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={{
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
          onLoad={(map) => setMap(map)}
        >
          <Marker position={center} />
          {originMarker && <Marker position={originMarker} label="A" />}
          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
        </GoogleMap>
      </Box>

      <Box
        p={{ base: 2, md: 4 }}
        borderRadius="lg"
        m={4}
        bgColor="white"
        shadow="base"
        w={{ base: "90vw", md: "container.md" }}
        zIndex="1"
      >
        <Collapse in={!isCollapsed} animateOpacity>
          <Stack
            spacing={2}
            direction={{ base: "column", md: "row" }}
            justifyContent="space-between"
          >
            <Box flexGrow={1}>
              <Autocomplete>
                <Input
                  type="text"
                  placeholder="Origin"
                  ref={originRef}
                  size="xs"
                />
              </Autocomplete>
            </Box>
            <Box flexGrow={1}>
              <Autocomplete>
                <Input
                  type="text"
                  placeholder="Destination"
                  ref={destiantionRef}
                  size="xs"
                />
              </Autocomplete>
            </Box>

            <ButtonGroup
              flexWrap="wrap"
              display="flex"
              justifyContent={{ base: "center", md: "flex-start" }}
            >
              <Button
                colorScheme="pink"
                type="submit"
                onClick={calculateRoute}
                size="xs"
              >
                Start
              </Button>
              <IconButton
                aria-label="Clear"
                icon={<FaTimes />}
                onClick={clearRoute}
                size="xs"
              />
              <Button onClick={getCurrentLocation} colorScheme="blue" size="xs">
                Use My Location
              </Button>
            </ButtonGroup>
          </Stack>

          <Button
            size="sm"
            mt={2}
            onClick={() => setIsCollapsed(true)}
            colorScheme="gray"
            w="100%"
          >
            Collapse Route Inputs
          </Button>
        </Collapse>

        {isCollapsed && (
          <Button
            size="sm"
            mt={2}
            onClick={() => setIsCollapsed(false)}
            colorScheme="teal"
            w="100%"
          >
            Expand Route Inputs
          </Button>
        )}

        <Stack
          spacing={2}
          direction={{ base: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ base: "flex-start", md: "center" }}
          mt={4}
        >
          <Text fontSize="sm">Distance: {distance} </Text>
          <Text fontSize="sm">Duration: {duration} </Text>
          <IconButton
            aria-label="Recenter"
            icon={<FaLocationArrow />}
            isRound
            onClick={() => {
              map.panTo(center);
              map.setZoom(15);
            }}
            size="sm"
          />
        </Stack>
      </Box>
    </Flex>
  );
}

export default App;
