import os
import urllib.request
import zipfile
import shutil
import time

def download_openpowerlifting_data():
    url = "https://openpowerlifting.gitlab.io/opl-csv/files/openpowerlifting-latest.zip"
    raw_dir = "data/raw"
    zip_path = os.path.join(raw_dir, "openpowerlifting-latest.zip")
    target_dataset_dir = os.path.join(raw_dir, "dataset")

    print("=======================================")
    print(f"1. Downloading data from {url}...")
    print("=======================================")
    
    start_time = time.time()
    # Adding User-Agent to avoid potential 403 Forbidden errors
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
        shutil.copyfileobj(response, out_file)
        
    print(f"Download complete in {time.time() - start_time:.1f} seconds.")

    print("\n=======================================")
    print("2. Extracting zip file...")
    print("=======================================")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        # Get the root directory name from the zip (e.g. 'openpowerlifting-202X-XX-XX/')
        extracted_folder_name = zip_ref.namelist()[0].split('/')[0]
        zip_ref.extractall(raw_dir)

    print("Cleaning up zip file...")
    os.remove(zip_path)

    extracted_folder_path = os.path.join(raw_dir, extracted_folder_name)
    
    print("\n=======================================")
    print(f"3. Renaming to '{target_dataset_dir}'")
    print("=======================================")
    # If target already exists, remove it to replace with fresh download
    if os.path.exists(target_dataset_dir):
        print(f"Removing existing '{target_dataset_dir}' directory to overwrite...")
        shutil.rmtree(target_dataset_dir)
        
    os.rename(extracted_folder_path, target_dataset_dir)
    
    print("\n Data download and extraction complete!")
    
    # Verify contents
    files = os.listdir(target_dataset_dir)
    print(f"\nContents of {target_dataset_dir}:")
    for f in files:
        file_path = os.path.join(target_dataset_dir, f)
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        print(f" - {f} ({size_mb:.1f} MB)")

if __name__ == "__main__":
    download_openpowerlifting_data()
