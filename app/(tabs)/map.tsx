import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Building, ChevronDown, Crosshair, Heart, Image as ImageIcon, MapPin, MapPinOff, MessageCircle, Plus, Utensils, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { CAMPUS_BUILDINGS } from '../../data/buildings';
import { CAMPUS_LOCATIONS } from '../../services/locations';
import { CampusLocation } from '../../types';
import { compressImage } from '../../utils/image';

const { width, height } = Dimensions.get('window');

// HKBU Campus coordinates
const HKBU_CENTER = {
    lat: 22.3380,
    lng: 114.1813
};

type FilterType = 'newest' | 'hottest' | 'viewed' | 'mine';

const FILTERS: { id: FilterType; label: string; color: string; bg: string }[] = [
    { id: 'newest', label: 'Newest', color: '#2196F3', bg: '#BBDEFB' },     // Blue
    { id: 'hottest', label: 'Hottest', color: '#F44336', bg: '#FFCDD2' },   // Red
    { id: 'viewed', label: 'Most Viewed', color: '#FF9800', bg: '#FFE0B2' }, // Orange
    { id: 'mine', label: 'My Pins', color: '#FFEB3B', bg: '#FFF9C4' },      // Yellow
];

// Helper to generate random coordinates near HKBU
const randomLoc = () => ({
    lat: HKBU_CENTER.lat + (Math.random() - 0.5) * 0.005,
    lng: HKBU_CENTER.lng + (Math.random() - 0.5) * 0.005
});

// Helper to create mock posts
const createMockPosts = (count: number, type: FilterType) => {
    return Array.from({ length: count }).map((_, i) => {
        const filter = FILTERS.find(f => f.id === type)!;
        return {
            id: `${type}_${i}`,
            author: { name: `User ${Math.floor(Math.random() * 1000)}`, avatar: '👤' },
            category: type === 'hottest' ? 'Trending' : type === 'viewed' ? 'Popular' : 'General',
            time: `${Math.floor(Math.random() * 24)}h ago`,
            content: `This is a mock post for ${type} filter. Item #${i + 1}.`,
            location: { name: `Location ${i}`, ...randomLoc() },
            color: filter.bg, // Card background color
            pinColor: filter.color, // Map marker color
            type,
            likes: Math.floor(Math.random() * 50),
            isLiked: false,
            // Generate some random comments
            commentList: Array.from({ length: Math.floor(Math.random() * 4) }).map((_, j) => ({
                id: `c_${i}_${j}`,
                author: `User ${Math.floor(Math.random() * 1000)}`,
                content: j % 2 === 0 ? "Great spot! 🤩" : "Thanks for sharing.",
                time: `${Math.floor(Math.random() * 5)}h ago`
            })),
            get comments() {
                return this.commentList.length; // Sync count with list
            }
        };
    });
};

const MOCK_DATA = {
    newest: createMockPosts(20, 'newest'),
    hottest: createMockPosts(20, 'hottest'),
    viewed: createMockPosts(20, 'viewed'),
    mine: createMockPosts(5, 'mine'), // Fewer posts for "Mine"
};

// Generate Leaflet HTML with markers
const generateMapHTML = (posts: any[], foodSpots: CampusLocation[] = [], buildings: CampusLocation[] = [], showFoodMap: boolean = false, showBuildingMap: boolean = false, editMode: boolean = false): string => {
    // Pin SVG Template (Teardrop shape like standard marker)
    const pinSvg = (color: string) => `
        <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3));">
            <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
            <circle cx="12" cy="12" r="4" fill="white" fill-opacity="0.9"/>
        </svg>
    `;

    // Food Marker Template (Circular with Image + Building Label)
    const foodMarkerHtml = (imageUrl: string, name: string, description: string, labelPosition: 'top' | 'bottom' = 'top') => {
        const buildingMatch = description.match(/\(([^)]+)\)/);
        const building = buildingMatch ? buildingMatch[1] : '';
        const labelHtml = building ? `
            <div style="
                background: #FF6B6B;
                color: white;
                font-size: 8px;
                font-weight: bold;
                padding: 1px 4px;
                border-radius: 4px;
                z-index: 10;
                border: 1px solid white;
                white-space: nowrap;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                ${labelPosition === 'top' ? 'margin-bottom: -6px;' : 'margin-top: -6px;'}
            ">🏢 ${building}</div>` : '';

        return `
            <div style="display: flex; flex-direction: column; align-items: center;">
                ${labelPosition === 'top' ? labelHtml : ''}
                <div style="
                    width: 36px;
                    height: 36px;
                    border-radius: 18px;
                    background: white;
                    border: 2px solid #FF6B6B;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                    position: relative;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3170/3170733.png'"/>
                </div>
                ${labelPosition === 'bottom' ? labelHtml : ''}
            </div>
        `;
    };

    // Building Marker Template (Blue Square with Label)
    const buildingMarkerHtml = (name: string) => {
        // Extract common abbreviations (last parentheses)
        const match = name.match(/\(([^)]+)\)$/);
        const abbr = match ? match[1] : name.substring(0, 3).toUpperCase();

        return `
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="
                    background: #4B0082;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    padding: 2px 6px;
                    border-radius: 4px;
                    border: 1px solid white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    margin-bottom: -4px;
                    z-index: 10;
                    white-space: nowrap;
                ">${abbr}</div>
                <div style="
                    width: 12px;
                    height: 12px;
                    background: #4B0082;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                "></div>
            </div>
        `;
    };

    const markers = posts.map(post => {
        if (!post || !post.location) return '';
        return `
        L.marker([${post.location.lat}, ${post.location.lng}], { 
            icon: L.divIcon({
                className: 'custom-pin-icon',
                html: \`${pinSvg(post.pinColor)}\`,
                iconSize: [24, 32],
                iconAnchor: [12, 32], // Bottom tip center
                popupAnchor: [0, -32]
            }) 
        })
        .addTo(markerLayer) // Add to layer instead of map
        .bindPopup(\`
            <div style="min-width: 150px;">
                <div style="font-weight: bold; margin-bottom: 4px; color: ${post.pinColor || '#333'};">
                    ${post.author?.avatar || '👤'} ${post.category || ''}
                </div>
                <div style="fontSize: 12px; color: #666; margin-bottom: 6px;">
                    ${post.time || ''}
                </div>
                <div style="fontSize: 13px; line-height: 1.4;">
                    ${post.content || ''}
                </div>
                <div style="fontSize: 11px; color: #888; margin-top: 6px;">
                    📍 ${post.location?.name || ''}
                </div>
            </div>
        \`);`;
    }).join('\n');

    const foodMarkers = foodSpots.map(spot => {
        // Southern markers in crowded pairs get 'bottom' labels
        const labelPos = (['o5', 'o7', 'o14'].includes(spot.id)) ? 'bottom' : 'top';

        return `
            L.marker([${spot.coordinates.latitude}, ${spot.coordinates.longitude}], { 
                icon: L.divIcon({
                    className: 'food-marker-icon',
                    html: \`${foodMarkerHtml(spot.imageUrl || '', spot.name, spot.description || '', labelPos)}\`,
                    iconSize: [50, 50],
                    iconAnchor: [25, 25],
                    popupAnchor: [0, -18]
                }) 
            })
            .addTo(foodLayer)
            .bindPopup(\`
                <div style="min-width: 160px; padding: 2px;">
                    <img src="${spot.imageUrl}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #111;">${spot.name}</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 6px;">🕒 ${spot.hours || 'N/A'}</div>
                    <div style="font-size: 11px; color: #444; line-height: 1.4;">${spot.description}</div>
                    <div style="margin-top: 10px; display: flex; justify-content: center;">
                        <button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'view_food', id: '${spot.id}'}))" style="
                            background: #FF6B6B;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                            width: 100%;
                        ">View Details</button>
                    </div>
                </div>
            \`, { closeButton: false });
        `;
    }).join('\n');

    const buildingMarkers = buildings.map(b => {
        return `
            var bm = L.marker([${b.coordinates.latitude}, ${b.coordinates.longitude}], { 
                icon: L.divIcon({
                    className: 'building-marker-icon',
                    html: \`${buildingMarkerHtml(b.name)}\`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 26],
                    popupAnchor: [0, -20]
                }),
                draggable: ${editMode} 
            })
            .addTo(buildingLayer)
            .bindPopup(\`
                <div style="min-width: 160px; padding: 2px;">
                    <img src="${b.imageUrl}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" onerror="this.style.display='none'" />
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #111;">${b.name}</div>
                    <div style="font-size: 11px; color: #444; line-height: 1.4;">${b.description}</div>
                    ${editMode ? '<div style="font-size: 10px; color: red; margin-top: 4px;">Drag to move</div>' : ''}
                </div>
            \`, { closeButton: false });

            bm.on('dragend', function(e) {
                var newLatLng = e.target.getLatLng();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'building_dragged',
                    id: '${b.id}',
                    lat: newLatLng.lat,
                    lng: newLatLng.lng
                }));
            });
        `;
    }).join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; width: 100%; }
        #map { height: 100%; width: 100%; }
        .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
            margin: 12px;
        }
        .user-marker-pulse {
            width: 18px;
            height: 18px;
            background-color: #2196F3;
            border: 2.5px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            animation: pulse 2s infinite;
            position: relative;
            z-index: 5;
        }
        .user-direction-arrow {
            position: absolute;
            top: -14px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 14px solid #2196F3;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
            pointer-events: none;
            z-index: 10;
        }
        .user-direction-container {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.1s linear;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); }
            100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
        }
        .custom-pin-icon {
            background: transparent;
            border: none;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', {
            zoomControl: false
        }).setView([${HKBU_CENTER.lat}, ${HKBU_CENTER.lng}], 17);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
        
        // Marker Layer Group
        var markerLayer = L.layerGroup().addTo(map);
        var foodLayer = L.layerGroup();
        var buildingLayer = L.layerGroup();
        
        if (${showFoodMap}) foodLayer.addTo(map);
        if (${showBuildingMap}) buildingLayer.addTo(map);
        
        ${markers}
        ${foodMarkers}
        ${buildingMarkers}
        
        // Manual Toggle Function
        window.setMarkersVisible = function(visible) {
            if (visible) {
                markerLayer.addTo(map);
            } else {
                map.removeLayer(markerLayer);
            }
        };

        window.setFoodMapVisible = function(visible) {
            if (visible) {
                foodLayer.addTo(map);
            } else {
                map.removeLayer(foodLayer);
            }
        };

        window.setBuildingMapVisible = function(visible) {
            if (visible) {
                buildingLayer.addTo(map);
            } else {
                map.removeLayer(buildingLayer);
            }
        };
        
        // User Location Marker
        var userMarker = null;

        window.updateUserLocation = function(lat, lng) {
            if (userMarker) {
                userMarker.setLatLng([lat, lng]);
            } else {
                var userIcon = L.divIcon({
                    className: 'user-marker-icon-container',
                    html: \`
                        <div id="user-heading-container" class="user-direction-container">
                            <div class="user-direction-arrow"></div>
                            <div class="user-marker-pulse"></div>
                        </div>
                    \`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });
                userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
            }
        };

        window.updateUserHeading = function(heading) {
            var container = document.getElementById('user-heading-container');
            if (container) {
                container.style.transform = 'rotate(' + heading + 'deg)';
            }
        };

        window.centerMap = function(lat, lng) {
            map.flyTo([lat, lng], 18);
        };
        
        // Global variable for pending marker
        var pendingMarker = null;
        
        // Pin SVG for pending marker (Blue)
        const pendingPinSvg = \`
            <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3));">
                <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="#2196F3"/>
                <circle cx="12" cy="12" r="4" fill="white" fill-opacity="0.9"/>
            </svg>
        \`;

        // Map Click Handler
        map.on('click', function(e) {
            var lat = e.latlng.lat;
            var lng = e.latlng.lng;

            // Remove previous pending marker if exists
            if (pendingMarker) {
                map.removeLayer(pendingMarker);
            }

            // Add new pending marker (Pin)
            var pendingIcon = L.divIcon({
                className: 'custom-pin-icon',
                html: pendingPinSvg,
                iconSize: [24, 32],
                iconAnchor: [12, 32]
            });

            pendingMarker = L.marker([lat, lng], { icon: pendingIcon }).addTo(map);

            // Send to RN
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'map_clicked',
                lat: lat,
                lng: lng
            }));
        });
        
        // Send message when post marker clicked
        map.on('popupopen', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'popup_open',
                lat: e.popup.getLatLng().lat,
                lng: e.popup.getLatLng().lng
            }));
        });
        // Navigation Line Logic
        window.navPath = null;
        window.drawNavigationPath = function(userLat, userLng, targetLat, targetLng) {
            if (window.navPath) {
                map.removeLayer(window.navPath);
            }
            var latlngs = [
                [userLat, userLng],
                [targetLat, targetLng]
            ];
            window.navPath = L.polyline(latlngs, {
                color: '#2196F3',
                weight: 4,
                opacity: 0.7,
                dashArray: '10, 10',
                lineCap: 'round'
            }).addTo(map);
            map.fitBounds(latlngs, { padding: [50, 50] });

        };

        window.clearNavigationPath = function() {
            if (window.navPath) {
                map.removeLayer(window.navPath);
                window.navPath = null;
            }
        };
    </script>
</body>
</html>
    `;
};

export default function MapScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [activeFilter, setActiveFilter] = useState<FilterType>('newest');
    const [selectedCampus, setSelectedCampus] = useState('HKBU (本部校区)');
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [heading, setHeading] = useState<number>(0);
    const [pendingLocation, setPendingLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [markersVisible, setMarkersVisible] = useState(true);
    const [showFoodMap, setShowFoodMap] = useState(false);
    const [showBuildingMap, setShowBuildingMap] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [buildingsData, setBuildingsData] = useState(CAMPUS_BUILDINGS);
    const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentImage, setCommentImage] = useState<string | null>(null);

    // Navigation State
    const [navTarget, setNavTarget] = useState<{ lat: number, lng: number } | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    // Handle navigation params
    useEffect(() => {
        if (params.navLat && params.navLng) {
            const lat = parseFloat(params.navLat as string);
            const lng = parseFloat(params.navLng as string);

            // Only update if target has changed to prevent infinite loop
            if (!navTarget || navTarget.lat !== lat || navTarget.lng !== lng) {
                setNavTarget({ lat, lng });
                setIsNavigating(true);

                // 1. Immediately focus on target
                webViewRef.current?.injectJavaScript(`
                    window.centerMap(${lat}, ${lng});
                    true;
                `);

                // 2. Trigger location fetch if not already known
                // pass autoCenter = false to avoid overriding the target view until we have both points
                if (!userLocation) {
                    handleLocationPress(false);
                }
            }
        }
    }, [params.navLat, params.navLng]);

    // Effect to draw line when both locations are known and navigating
    useEffect(() => {
        if (isNavigating && navTarget && userLocation) {
            webViewRef.current?.injectJavaScript(`
                if (window.drawNavigationPath) {
                    window.drawNavigationPath(${userLocation.lat}, ${userLocation.lng}, ${navTarget.lat}, ${navTarget.lng});
                }
                true;
            `);
        }
    }, [isNavigating, navTarget, userLocation]);

    // Load saved buildings from storage on mount
    useEffect(() => {
        const loadSavedBuildings = async () => {
            try {
                const savedData = await AsyncStorage.getItem('savedBuildingsData');
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    // Merge with current data structure to ensure new fields/buildings are present
                    // but prefer saved coordinates
                    const mergedData = CAMPUS_BUILDINGS.map(defaultB => {
                        const savedB = parsed.find((p: any) => p.id === defaultB.id);
                        if (savedB) {
                            return { ...defaultB, coordinates: savedB.coordinates };
                        }
                        return defaultB;
                    });
                    setBuildingsData(mergedData);
                }
            } catch (e) {
                console.error("Failed to load saved buildings", e);
            }
        };
        loadSavedBuildings();
    }, []);

    // Save to storage whenever buildingsData changes (debounced or on key events)
    // For simplicity, we'll save on drag end (which updates state) and on export.

    useEffect(() => {
        if (buildingsData !== CAMPUS_BUILDINGS) {
            AsyncStorage.setItem('savedBuildingsData', JSON.stringify(buildingsData)).catch(e => console.error(e));
        }
    }, [buildingsData]);

    const webViewRef = useRef<WebView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Track heading
    React.useEffect(() => {
        let headingSubscription: Location.LocationSubscription | null = null;

        async function startHeadingTrack() {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                headingSubscription = await Location.watchHeadingAsync((data) => {
                    const h = Math.round(data.trueHeading || data.magHeading);
                    setHeading(h);
                });
            } catch (err) {
                console.log('Heading error:', err);
            }
        }

        startHeadingTrack();
        return () => {
            if (headingSubscription) {
                headingSubscription.remove();
            }
        };
    }, []);

    // Sync heading with WebView
    React.useEffect(() => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                if (window.updateUserHeading) {
                    window.updateUserHeading(${heading});
                }
                true;
            `);
        }
    }, [heading]);

    // Trigger animation when selection changes
    React.useEffect(() => {
        if (pendingLocation || selectedPost) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.back(1.5)),
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [pendingLocation, selectedPost]);

    // Sync markers visibility with WebView
    React.useEffect(() => {
        webViewRef.current?.injectJavaScript(`
            if (window.setMarkersVisible) {
                window.setMarkersVisible(${markersVisible && !showFoodMap});
            }
            if (window.setFoodMapVisible) {
                window.setFoodMapVisible(${showFoodMap});
            }
            true;
        `);
    }, [markersVisible, showFoodMap]);

    // Sync building map visibility with WebView
    React.useEffect(() => {
        webViewRef.current?.injectJavaScript(`
            if (window.setBuildingMapVisible) {
                window.setBuildingMapVisible(${showBuildingMap});
            }
            // Auto hide other layers if one is active to reduce clutter? For now keep independent or managed by user
            true;
        `);
    }, [showBuildingMap]);

    // Filter data based on navigation state
    const currentPosts = isNavigating ? [] : MOCK_DATA[activeFilter];
    const currentFoodSpots = isNavigating ? [] : (CAMPUS_LOCATIONS || []).filter(l => l.category === 'Food');
    // For buildings, if navigating, only show the target building if possible (we don't have ID easily, so maybe show all or try to filter by coordinate match)
    // Actually, we can filter by coordinate match since navTarget has lat/lng
    const currentBuildings = isNavigating && navTarget
        ? buildingsData.filter(b => Math.abs(b.coordinates.latitude - navTarget.lat) < 0.0001 && Math.abs(b.coordinates.longitude - navTarget.lng) < 0.0001)
        : buildingsData;

    const handleLocationPress = async (autoCenter = true) => {
        setLocating(true);
        try {
            // 1. Request permissions
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            // 2. Get location
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // 3. Update Map via JS injection
            webViewRef.current?.injectJavaScript(`
                window.updateUserLocation(${latitude}, ${longitude});
                ${autoCenter ? `window.centerMap(${latitude}, ${longitude});` : ''}
                true;
            `);

            setPendingLocation({ lat: latitude, lng: longitude });
            setUserLocation({ lat: latitude, lng: longitude }); // Update user location state
        } catch (error) {
            Alert.alert('Error', 'Could not fetch location');
        } finally {
            setLocating(false);
        }
    };

    const handleAddPost = () => {
        if (pendingLocation) {
            router.push({
                pathname: '/compose',
                params: {
                    lat: pendingLocation.lat,
                    lng: pendingLocation.lng,
                    fromMap: 'true'
                }
            } as any);
            setPendingLocation(null);
        } else {
            Alert.alert(
                'Create Post',
                'Tap on the map to pin a specific location, or post without a location?',
                [
                    { text: 'Pin on Map First', style: 'cancel' },
                    { text: 'Post Anyway', onPress: () => router.push('/compose') }
                ]
            );
        }
    };

    const handleCampusSelect = () => {
        Alert.alert(
            '选择校区',
            '请选择您的校区',
            [
                { text: 'HKBU (本部校区)', onPress: () => setSelectedCampus('HKBU (本部校区)') },
                { text: 'HKBU (石门校区)', onPress: () => setSelectedCampus('HKBU (石门校区)') },
                { text: '取消', style: 'cancel' },
            ]
        );
    };

    const handleFindClassroom = () => {
        router.push('/classroom' as any);
    };

    const handleFindFood = () => {
        router.push('/food' as any);
    };

    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'map_clicked') {
                setPendingLocation({ lat: data.lat, lng: data.lng });
                return;
            }

            if (data.type === 'popup_open') {
                const lat = Number(data.lat);
                const lng = Number(data.lng);
                if (isNaN(lat) || isNaN(lng)) return;

                const post = (currentPosts || []).find(p =>
                    p?.location &&
                    Math.abs((p.location.lat || 0) - lat) < 0.0001 &&
                    Math.abs((p.location.lng || 0) - lng) < 0.0001
                );
                if (post) {
                    setSelectedPost(post);
                }
            }
            if (data.type === 'view_food') {
                router.push(`/food/${data.id}` as any);
                return;
            }
            if (data.type === 'building_dragged') {
                const { id, lat, lng } = data;
                setBuildingsData(prev => prev.map(b =>
                    b.id === id ? { ...b, coordinates: { latitude: lat, longitude: lng } } : b
                ));
            }
        } catch (e) {
            // Ignore
        }
    };

    const handleExportBuildings = async () => {
        const json = JSON.stringify(buildingsData, null, 4);
        console.log(json);
        await Clipboard.setStringAsync(json);
        Alert.alert('Data Exported', 'The new building data has been copied to your clipboard. Please paste it to me so I can update the file.');
    };

    const handleLike = () => {
        if (!selectedPost) return;
        setSelectedPost((prev: any) => ({
            ...prev,
            isLiked: !prev.isLiked,
            likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1
        }));
    };

    const handleComment = () => {
        setCommentText('');
        setCommentImage(null);
        setIsCommentModalVisible(true);
    };

    const handleExitNavigation = () => {
        setIsNavigating(false);
        setNavTarget(null);
        // Clear navigation params so we don't re-enter navigation on reload
        router.setParams({ navLat: '', navLng: '', navName: '' });

        webViewRef.current?.injectJavaScript(`
            if (window.clearNavigationPath) {
                window.clearNavigationPath();
            }
            true;
        `);
        // Optionally recenter map to user location
        if (userLocation) {
            webViewRef.current?.injectJavaScript(`
                window.centerMap(${userLocation.lat}, ${userLocation.lng});
                true;
            `);
        }
    };

    const pickCommentImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            const compressedUri = await compressImage(result.assets[0].uri);
            setCommentImage(compressedUri);
        }
    };

    const handleSubmitComment = () => {
        if (commentText.trim()) {
            const newComment = {
                id: `new_${Date.now()}`,
                author: 'Me',
                content: commentText.trim(),
                image: commentImage,
                time: 'Just now'
            };

            setSelectedPost((prev: any) => ({
                ...prev,
                commentList: [...(prev.commentList || []), newComment],
                comments: (prev.comments || 0) + 1
            }));
            setCommentText('');
            setCommentImage(null);
            setIsCommentModalVisible(false);
            // Alert.alert('Success', 'Comment posted!'); // No need for alert if it appears in list
        }
    };

    return (
        <View style={styles.container}>
            {/* Real Map */}
            <WebView
                ref={webViewRef}
                key={activeFilter + (editMode ? '_edit' : '') + (isNavigating ? '_nav' : '')} // Force re-render on mode change
                source={{ html: String(generateMapHTML(currentPosts, currentFoodSpots, currentBuildings, showFoodMap, showBuildingMap, editMode)) }}
                style={styles.map}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
            />

            {/* Header Overlay */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Campus</Text>
                    <TouchableOpacity style={styles.campusSelector} onPress={handleCampusSelect}>
                        <Text style={styles.campusText}>{selectedCampus.split(' ')[0]}</Text>
                        <ChevronDown size={14} color="#333" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[
                        styles.foodMapBadge,
                        showFoodMap ? styles.foodMapBadgeActive : styles.foodMapBadgeInactive
                    ]}
                    onPress={() => setShowFoodMap(!showFoodMap)}
                >
                    <Utensils size={18} color={showFoodMap ? "#fff" : "#FF6B6B"} />
                    <Text style={[styles.foodMapBadgeText, showFoodMap && { color: '#fff' }]}>
                        {showFoodMap ? '美食地图: 开' : '美食地图'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.foodMapBadge,
                        { marginLeft: 8 }, // Add margin
                        showBuildingMap ? { backgroundColor: '#4B0082', borderColor: '#4B0082' } : styles.foodMapBadgeInactive
                    ]}
                    onPress={() => setShowBuildingMap(!showBuildingMap)}
                >
                    <Building size={16} color={showBuildingMap ? "#fff" : "#4B0082"} />
                    <Text style={[styles.foodMapBadgeText, showBuildingMap && { color: '#fff' }]}>
                        {showBuildingMap ? '建筑地图: 开' : '建筑地图'}
                    </Text>
                </TouchableOpacity>
            </View>


            {/* Filter Bar */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {FILTERS.map((filter) => {
                        const isActive = activeFilter === filter.id;
                        return (
                            <TouchableOpacity
                                key={filter.id}
                                style={[
                                    styles.filterChip,
                                    isActive && { backgroundColor: filter.color, borderColor: filter.color }
                                ]}
                                onPress={() => {
                                    setActiveFilter(filter.id);
                                    // Reset user loc on filter change? maybe not
                                }}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        isActive && { color: '#fff', fontWeight: 'bold' }
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.bottomControls}>
                {/* Marker Toggle Button (Top of group) */}
                <TouchableOpacity
                    style={[styles.iconButton, !markersVisible && { backgroundColor: '#F3F4F6' }]}
                    onPress={() => setMarkersVisible(!markersVisible)}
                >
                    {markersVisible ? (
                        <MapPin size={22} color="#1E3A8A" />
                    ) : (
                        <MapPinOff size={22} color="#6B7280" />
                    )}
                    <Text style={[styles.iconButtonText, !markersVisible && { color: '#6B7280' }]}>
                        {markersVisible ? '隐藏' : '显示'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={handleFindClassroom}>
                    <Building size={20} color="#4B0082" />
                    <Text style={styles.iconButtonText}>教室</Text>
                </TouchableOpacity>

                {showBuildingMap && (
                    <TouchableOpacity
                        style={[styles.iconButton, editMode && { backgroundColor: '#FFD700' }]}
                        onPress={() => {
                            if (editMode) {
                                // Save/Exit
                                handleExportBuildings();
                            }
                            setEditMode(!editMode);
                        }}
                    >
                        <MapPin size={20} color={editMode ? "#000" : "#4B0082"} />
                        <Text style={styles.iconButtonText}>{editMode ? 'Save' : 'Edit'}</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.iconButton} onPress={handleFindFood}>
                    <Utensils size={20} color="#E65100" />
                    <Text style={styles.iconButtonText}>美食</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.locationButton, locating && { opacity: 0.7 }]}
                    onPress={() => handleLocationPress(true)}
                    disabled={locating}
                >
                    {locating ? (
                        <ActivityIndicator size="small" color="#4B0082" />
                    ) : (
                        <Crosshair size={22} color="#333" />
                    )}
                </TouchableOpacity>

                {isNavigating && (
                    <TouchableOpacity
                        style={[styles.locationButton, { backgroundColor: '#FF5252' }]}
                        onPress={handleExitNavigation}
                    >
                        <X size={22} color="#fff" />
                    </TouchableOpacity>
                )}

                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim }] }}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddPost}
                        activeOpacity={0.7}
                    >
                        <Plus size={28} color="#fff" />
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Floating Post Cards */}
            {
                markersVisible && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.postsScroll}
                        contentContainerStyle={styles.postsContent}
                    >
                        {(currentPosts || []).map((post) => {
                            if (!post || !post.location) return null;
                            return (
                                <TouchableOpacity
                                    key={post.id}
                                    style={[styles.floatingCard, { backgroundColor: post.color || '#fff' }]}
                                    onPress={() => setSelectedPost(post)}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardAvatar}>{post.author?.avatar || '👤'}</Text>
                                        <Text style={styles.cardCategory}>{post.category || ''}</Text>
                                        <Text style={styles.cardTime}>{post.time || ''}</Text>
                                    </View>
                                    <Text style={styles.cardContent} numberOfLines={2}>
                                        {post.content || ''}
                                    </Text>
                                    <Text style={styles.locationText}>📍 {post?.location?.name || ''}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )
            }

            {/* Post Detail Modal */}
            <Modal
                visible={selectedPost !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setSelectedPost(null);
                    setIsCommentModalVisible(false);
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        onPress={() => {
                            setSelectedPost(null);
                            setIsCommentModalVisible(false);
                        }}
                    />
                    {selectedPost && (
                        <View style={[styles.modalContent, { backgroundColor: selectedPost.color || '#fff' }]}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => {
                                    setSelectedPost(null);
                                    setIsCommentModalVisible(false);
                                }}
                            >
                                <X size={20} color="#666" />
                            </TouchableOpacity>

                            <View style={styles.modalHeader}>
                                <Text style={styles.modalAvatar}>{selectedPost.author?.avatar || '👤'}</Text>
                                <View style={styles.modalInfo}>
                                    <Text style={styles.modalAuthor}>{selectedPost.author?.name || 'Anonymous'}</Text>
                                    <Text style={styles.modalCategory}>{selectedPost.category || ''} · {selectedPost.time || ''}</Text>
                                </View>
                            </View>

                            <Text style={styles.modalText}>{selectedPost.content || ''}</Text>

                            <View style={styles.modalLocation}>
                                <Text style={styles.modalLocationText}>📍 {selectedPost?.location?.name || ''}</Text>
                            </View>

                            {/* Comment List Section */}
                            {selectedPost?.commentList && selectedPost.commentList.length > 0 ? (
                                <View style={styles.commentsSection}>
                                    <Text style={styles.commentsHeader}>Comments ({selectedPost.commentList.length})</Text>
                                    <ScrollView
                                        style={styles.commentsList}
                                        nestedScrollEnabled={true}
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {selectedPost.commentList.map((comment: any) => (
                                            <View key={comment.id} style={styles.commentItem}>
                                                <View style={styles.commentHeader}>
                                                    <Text style={styles.commentAuthor}>{comment?.author || 'User'}</Text>
                                                    <Text style={styles.commentTime}>{comment?.time || ''}</Text>
                                                </View>
                                                <Text style={styles.commentContent}>{comment?.content || ''}</Text>
                                                {comment?.image && (
                                                    <Image source={{ uri: comment.image || '' }} style={styles.commentImage} />
                                                )}
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            ) : (
                                <View style={styles.noCommentsContainer}>
                                    <Text style={styles.noCommentsText}>No comments yet. Be the first to share!</Text>
                                </View>
                            )}

                            {!isCommentModalVisible ? (
                                <View style={styles.socialActions}>
                                    <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                                        <Heart
                                            size={24}
                                            color={selectedPost.isLiked ? "#E91E63" : "#666"}
                                            fill={selectedPost.isLiked ? "#E91E63" : "none"}
                                        />
                                        <Text style={[styles.actionText, selectedPost.isLiked && { color: "#E91E63" }]}>
                                            Like {selectedPost.likes || 0}
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={styles.divider} />

                                    <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
                                        <MessageCircle size={24} color="#666" />
                                        <Text style={styles.actionText}>{selectedPost.comments || 0}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.commentInputContainer}>
                                    <Text style={styles.commentModalTitle}>Write a Comment</Text>
                                    <TextInput
                                        style={styles.commentInput}
                                        placeholder="What are your thoughts?"
                                        placeholderTextColor="#999"
                                        multiline
                                        autoFocus
                                        value={commentText}
                                        onChangeText={setCommentText}
                                    />

                                    {commentImage && (
                                        <View style={styles.commentImagePreviewContainer}>
                                            <Image source={{ uri: commentImage || '' }} style={styles.commentImagePreview} />
                                            <TouchableOpacity
                                                style={styles.removeCommentImageButton}
                                                onPress={() => setCommentImage(null)}
                                            >
                                                <X size={14} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <TouchableOpacity style={styles.addImageButton} onPress={pickCommentImage}>
                                        <ImageIcon size={20} color="#4B0082" />
                                        <Text style={styles.addImageText}>
                                            {commentImage ? 'Change Image' : 'Add Image'}
                                        </Text>
                                    </TouchableOpacity>
                                    <View style={styles.commentActions}>
                                        <TouchableOpacity
                                            style={styles.commentCancelButton}
                                            onPress={() => setIsCommentModalVisible(false)}
                                        >
                                            <Text style={styles.commentCancelText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.commentPostButton}
                                            onPress={handleSubmitComment}
                                        >
                                            <Text style={styles.commentPostText}>Post</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </KeyboardAvoidingView>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    map: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 100,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111',
        textShadowColor: 'rgba(255,255,255,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        marginBottom: 8,
    },
    campusSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    campusText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
        marginRight: 4,
    },
    iconButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    iconButtonText: {
        fontSize: 10,
        color: '#333',
        fontWeight: '700',
        marginTop: 2,
    },
    foodMapBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    foodMapBadgeInactive: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#FF6B6B',
    },
    foodMapBadgeActive: {
        backgroundColor: '#FF6B6B',
    },
    foodMapBadgeText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    filterContainer: {
        position: 'absolute',
        top: 130, // Below header
        left: 0,
        right: 0,
        zIndex: 90,
    },
    filterScroll: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 10,
    },
    filterChip: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
    },
    bottomControls: {
        position: 'absolute',
        right: 20,
        bottom: 280,
        alignItems: 'center',
        gap: 12,
        zIndex: 100,
    },
    locationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1E3A8A', // Using primary blue for the add button
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    postsScroll: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    postsContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    floatingCard: {
        width: 200,
        padding: 14,
        borderRadius: 16,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardAvatar: {
        fontSize: 16,
        marginRight: 6,
    },
    cardCategory: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    cardTime: {
        fontSize: 10,
        color: '#888',
    },
    cardContent: {
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
        marginBottom: 8,
    },
    locationText: {
        fontSize: 11,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        zIndex: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalAvatar: {
        fontSize: 32,
        marginRight: 12,
    },
    modalInfo: {
        flex: 1,
    },
    modalAuthor: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
    },
    modalCategory: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    modalText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 16,
    },
    modalLocation: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    modalLocationText: {
        fontSize: 13,
        color: '#555',
    },
    socialActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginHorizontal: 16,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginLeft: 8,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: '#eee',
    },
    commentModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end', // Or center if preferred, but bottom sheet style is nice
    },
    commentModalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    commentModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        minHeight: 250,
    },
    commentModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
        textAlign: 'center',
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 12,
        height: 100,
        fontSize: 16,
        textAlignVertical: 'top',
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
    },
    commentActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    commentCancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    commentCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    commentPostButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#1E3A8A',
        alignItems: 'center',
    },
    commentPostText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    commentInputContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    commentsSection: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 16,
        maxHeight: 300,
    },
    noCommentsContainer: {
        marginTop: 16,
        paddingVertical: 10,
        alignItems: 'center',
    },
    noCommentsText: {
        fontSize: 13,
        color: '#888',
        fontStyle: 'italic',
    },
    commentsHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    commentsList: {
        marginBottom: 10,
    },
    commentItem: {
        marginBottom: 12,
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 12,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    commentTime: {
        fontSize: 11,
        color: '#999',
    },
    commentContent: {
        fontSize: 13,
        color: '#555',
        lineHeight: 18,
    },
    commentImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginTop: 8,
        backgroundColor: '#eee',
    },
    addImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 10,
    },
    addImageText: {
        fontSize: 14,
        color: '#1E3A8A',
        fontWeight: '600',
        marginLeft: 8,
    },
    commentImagePreviewContainer: {
        position: 'relative',
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        width: 120,
        height: 120,
    },
    commentImagePreview: {
        width: '100%',
        height: '100%',
    },
    removeCommentImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4,
        borderRadius: 10,
    },
});
