"use client"

import Link from "next/link"
import { Shield, Flame, ArrowRight, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useEffect, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

// UC Davis coordinates
const UCDAVIS_COORDINATES = {
  lng: -121.7617,
  lat: 38.5382,
  zoom: 14.5
}

export default function LandingPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Initialize map only once
    if (map.current) return
    
    // Get access token from environment variable
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
    
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [UCDAVIS_COORDINATES.lng, UCDAVIS_COORDINATES.lat],
        zoom: UCDAVIS_COORDINATES.zoom,
        attributionControl: false,
        interactive: false // Disable map interactions for background use
      })

      map.current.on("load", () => {
        setMapLoaded(true)
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="px-6 lg:px-10 h-20 flex items-center border-b sticky top-0 bg-white/95 backdrop-blur-sm z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <Flame className="h-7 w-7 text-red-600" />
          <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-600">FireZero</span>
        </Link>
        <nav className="ml-auto flex gap-8">
          <Link href="/map" className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full transition-colors">
            View Map
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section with Mapbox Background */}
        <section className="w-full min-h-[calc(100vh-5rem)] relative overflow-hidden flex items-center">
          {/* Mapbox Container (Background) */}
          <div 
            ref={mapContainer} 
            className="absolute inset-0 w-full h-full z-0"
          />
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/80 to-white/60 z-10"></div>
          
          {/* Red highlight areas for fire safety zones */}
          {mapLoaded && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute top-1/4 left-1/3 w-24 h-24 rounded-full bg-red-500/20 animate-pulse"></div>
              <div className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full bg-amber-500/20 animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-red-500/30 animate-ping-slow"></div>
            </div>
          )}
          
          {/* Content */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
            <div className="max-w-4xl mx-auto lg:mx-0">
              <div className="space-y-10 text-center lg:text-left">
                <div className="space-y-6">
                  <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-red-500 to-amber-600 drop-shadow-sm">
                    FireZero
                  </h1>
                  <p className="text-2xl font-semibold text-gray-800 max-w-2xl mx-auto lg:mx-0 drop-shadow-sm">
                    Fire Safety Monitoring for UC Davis
                  </p>
                  <p className="text-xl text-gray-700 max-w-2xl mx-auto lg:mx-0 drop-shadow-sm">
                    Empowering California GovOps agencies with real-time fire hazard safety data for the UC Davis community.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                  <Link href="/map">
                    <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-10 py-7 text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group scale-105 hover:scale-110">
                      Explore the Map <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#data">
                    <Button variant="outline" className="px-10 py-7 text-xl font-semibold border-red-200 text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-105">Learn More</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources Section */}
        <section id="data" className="w-full py-24 lg:py-32 bg-white relative z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center space-y-8 mb-16">
              <div className="inline-block">
                <span className="inline-block px-8 py-6 mb-4 rounded-full bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-300 animate-pulse">
                  Data Sources
                </span>
              </div>
              <h2 className="text-4xl font-bold sm:text-5xl">Our Data Sources</h2>
              <p className="text-xl text-gray-600">
                FireZero combines two powerful datasets to provide comprehensive fire safety insights.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
              {[
                {
                  title: "CEED",
                  description: "The UC Davis Campus Energy and Environmental Data (CEED) provides detailed utility usage information (energy, water, gas, etc.) for various UC Davis facilities.",
                  link: "https://ceed.ucdavis.edu/",
                  linkText: "Visit CEED Website",
                  icon: Database,
                  color: "bg-blue-500"
                },
                {
                  title: "Clery Fire Safety",
                  description: "The Clery building-level fire safety reports provide specific information about fire safety measures in campus buildings, including fire alarms, drills, and sprinkler systems.",
                  link: "https://clery.ucdavis.edu/sites/g/files/dgvnsk1761/files/media/documents/ASFSR-UCD-2024vOct2024_0.pdf",
                  linkText: "View Clery Report",
                  icon: Shield,
                  color: "bg-red-500"
                }
              ].map((item, index) => (
                <div key={index} className="flex flex-col p-10 bg-white rounded-2xl shadow-xl text-left space-y-6 transition-all duration-300 hover:shadow-2xl group border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${item.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold">{item.title}</h3>
                  </div>
                  <p className="text-gray-600 flex-grow text-lg">{item.description}</p>
                  <Link
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-red-600 hover:text-red-700 font-medium group-hover:underline mt-4"
                  >
                    {item.linkText} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
