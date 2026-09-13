
import { ResourceCategory } from '../types';

export const resourceData: ResourceCategory[] = [
  {
    id: "cat_essentials",
    title: "Essential PC Setup",
    folders: [
      {
        id: "ess_browsers",
        name: "Web Browsers",
        items: [
          // FIX: Add missing 'owner' property.
          { id: "brw_chrome", name: "Google Chrome", description: "The world's most popular web browser.", link: "https://www.google.com/chrome/", owner: "admin" },
          // FIX: Add missing 'owner' property.
          { id: "brw_firefox", name: "Mozilla Firefox", description: "A privacy-focused browser from Mozilla.", link: "https://www.mozilla.org/en-US/firefox/new/", owner: "admin" },
          // FIX: Add missing 'owner' property.
          { id: "brw_brave", name: "Brave Browser", description: "A secure browser that blocks ads and trackers.", link: "https://brave.com/", owner: "admin" },
        ],
      },
      {
        id: "ess_productivity",
        name: "Productivity Tools",
        items: [
          // FIX: Add missing 'owner' property.
          { id: "prod_7zip", name: "7-Zip", description: "A free and open-source file archiver.", link: "https://www.7-zip.org/", owner: "admin" },
          // FIX: Add missing 'owner' property.
          { id: "prod_vlc", name: "VLC Media Player", description: "Plays most multimedia files as well as DVDs, Audio CDs, VCDs, and various streaming protocols.", link: "https://www.videolan.org/vlc/", owner: "admin" },
          // FIX: Add missing 'owner' property.
          { id: "prod_notepad++", name: "Notepad++", description: "A free source code editor and Notepad replacement.", link: "https://notepad-plus-plus.org/", owner: "admin" },
          // FIX: Add missing 'owner' property.
          { id: "prod_greenshot", name: "Greenshot", description: "A lightweight screenshot software tool for Windows.", link: "https://getgreenshot.org/", owner: "admin" },
        ],
      },
      {
        id: "ess_security",
        name: "Security Software",
        items: [
          // FIX: Add missing 'owner' property.
          { id: "sec_malwarebytes", name: "Malwarebytes", description: "Anti-malware software for Microsoft Windows, macOS, ChromeOS, Android, and iOS.", link: "https://www.malwarebytes.com/", owner: "admin" },
          // FIX: Add missing 'owner' property.
          { id: "sec_bitwarden", name: "Bitwarden", description: "A free and open-source password management service.", link: "https://bitwarden.com/", owner: "admin" },
        ],
      },
    ],
  },
  {
    id: "cat_dept",
    title: "Department PCs",
    folders: [
      { id: "dept_ao", name: "AO-PC", items: [] },
      { id: "dept_asms", name: "ASMS-PC", items: [] },
      { id: "dept_bc", name: "BC-PC", items: [] },
      { id: "dept_csa", name: "CSA-PC", items: [] },
      { id: "dept_cso", name: "CSO-PC", items: [] },
      { id: "dept_dhph", name: "DH-PH", items: [] },
      { id: "dept_hr", name: "HR-PC", items: [] },
      { id: "dept_it", name: "IT-PC", items: [
          // FIX: Add missing 'owner' property.
          { id: "it_vscode", name: "Visual Studio Code", description: "Code editor redefined and optimized for building and debugging modern web and cloud applications.", link: "https://code.visualstudio.com/", owner: "admin" },
          // FIX: Add missing 'owner' property.
          { id: "it_docker", name: "Docker Desktop", description: "The fastest way to containerize applications on your desktop.", link: "https://www.docker.com/products/docker-desktop/", owner: "admin" },
      ] },
      { id: "dept_rs5", name: "RS5-PC", items: [] },
      { id: "dept_rtv", name: "RTV-PC", items: [] },
      { id: "dept_sm", name: "SM-PC", items: [] },
      { id: "dept_tvads", name: "TVADS-PC", items: [] },
      { id: "dept_vmd", name: "VMD-PC", items: [] },
    ],
  },
];
