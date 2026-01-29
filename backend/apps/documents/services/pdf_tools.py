from pypdf import PdfReader, PdfWriter
import os

class PDFToolsService:
    @staticmethod
    def merge_pdfs(pdf_paths, output_path):
        writer = PdfWriter()
        for path in pdf_paths:
            writer.append(path)
        with open(output_path, "wb") as output_stream:
            writer.write(output_stream)
        return output_path

    @staticmethod
    def split_pdf(pdf_path, page_ranges, output_dir):
        """
        page_ranges: list of tuples (start, end) 1-indexed
        """
        reader = PdfReader(pdf_path)
        generated_files = []
        for i, (start, end) in enumerate(page_ranges):
            writer = PdfWriter()
            for page_num in range(start - 1, min(end, len(reader.pages))):
                writer.add_page(reader.pages[page_num])
            
            filename = f"split_{i+1}_{os.path.basename(pdf_path)}"
            path = os.path.join(output_dir, filename)
            with open(path, "wb") as f:
                writer.write(f)
            generated_files.append(path)
        return generated_files

    @staticmethod
    def remove_pages(pdf_path, pages_to_remove, output_path):
        """
        pages_to_remove: list of page numbers (1-indexed)
        """
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        for i in range(len(reader.pages)):
            if (i + 1) not in pages_to_remove:
                writer.add_page(reader.pages[i])
        with open(output_path, "wb") as f:
            writer.write(f)
        return output_path

    @staticmethod
    def reorder_pages(pdf_path, page_order, output_path):
        """
        page_order: list of page numbers (1-indexed) in desired order
        """
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        for page_num in page_order:
            if 1 <= page_num <= len(reader.pages):
                writer.add_page(reader.pages[page_num - 1])
        with open(output_path, "wb") as f:
            writer.write(f)
        return output_path
