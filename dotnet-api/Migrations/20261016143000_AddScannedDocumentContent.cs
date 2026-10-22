using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RecordRoom.Api.Infrastructure.Data;

#nullable disable

namespace RecordRoom.Api.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261016143000_AddScannedDocumentContent")]
public partial class AddScannedDocumentContent : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        foreach (var table in new[] { "DigitizationPages", "MapUploads" })
        {
            migrationBuilder.AddColumn<string>(name: "StorageKey", table: table, type: "nvarchar(80)", maxLength: 80, nullable: true);
            migrationBuilder.AddColumn<string>(name: "ContentType", table: table, type: "nvarchar(100)", maxLength: 100, nullable: true);
            migrationBuilder.AddColumn<long>(name: "SizeBytes", table: table, type: "bigint", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Sha256", table: table, type: "nvarchar(64)", maxLength: 64, nullable: true);
        }

        migrationBuilder.CreateTable(
            name: "RecordFileDocuments",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                RecordFileId = table.Column<int>(type: "int", nullable: false),
                Version = table.Column<int>(type: "int", nullable: false),
                OriginalFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                StorageKey = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                Sha256 = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UploadedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RecordFileDocuments", x => x.Id);
                table.ForeignKey(name: "FK_RecordFileDocuments_Files_RecordFileId", column: x => x.RecordFileId,
                    principalTable: "Files", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
            });
        migrationBuilder.CreateIndex(name: "IX_RecordFileDocuments_RecordFileId_Version", table: "RecordFileDocuments",
            columns: new[] { "RecordFileId", "Version" }, unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "RecordFileDocuments");
        foreach (var table in new[] { "DigitizationPages", "MapUploads" })
        {
            migrationBuilder.DropColumn(name: "StorageKey", table: table);
            migrationBuilder.DropColumn(name: "ContentType", table: table);
            migrationBuilder.DropColumn(name: "SizeBytes", table: table);
            migrationBuilder.DropColumn(name: "Sha256", table: table);
        }
    }
}
