#!/bin/bash

# Hämta senaste ändringarna från fjärrförrådet
git pull origin main

# Lägg till alla ändringar (du kan justera beroende på behov)
git add .

# Begär commit-meddelande
git commit -m "Automatiskt commit-meddelande"

# Skicka upp ändringarna
git push origin main
