using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecordRoom.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentPageCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PageCount",
                table: "RecordFileDocuments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PageCount",
                table: "MapUploads",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PageIndex",
                table: "MapUploads",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PageCount",
                table: "DigitizationPages",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PageIndex",
                table: "DigitizationPages",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PageCount",
                table: "RecordFileDocuments");

            migrationBuilder.DropColumn(
                name: "PageCount",
                table: "MapUploads");

            migrationBuilder.DropColumn(
                name: "PageIndex",
                table: "MapUploads");

            migrationBuilder.DropColumn(
                name: "PageCount",
                table: "DigitizationPages");

            migrationBuilder.DropColumn(
                name: "PageIndex",
                table: "DigitizationPages");
        }
    }
}
